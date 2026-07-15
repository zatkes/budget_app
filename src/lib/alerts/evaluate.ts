import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cycleStart, nextCycleStart, daysBetween } from "@/lib/date";
import { fmt } from "@/lib/format";

type AlertMode = "threshold" | "fixed_expected" | "balance_cap" | "none";
type AlertType = "soft" | "hard" | "pacing" | "fixed_deviation" | "balance_cap";

type CategoryAlertConfig = {
  id: string;
  key: string;
  name: string;
  monthly_limit: number | null;
  alert_mode: AlertMode;
  soft_threshold_pct: number;
  hard_threshold_pct: number;
  is_trial: boolean;
};

type BudgetPeriodRow = {
  id: string;
  category_id: string;
  period_start: string;
  period_end: string;
  soft_fired: boolean;
  hard_fired: boolean;
  pacing_fired: boolean;
  fixed_deviation_fired: boolean;
};

export type FiredAlert = {
  categoryId: string;
  categoryName: string;
  alertType: AlertType;
  spendSoFar: number;
  target: number | null;
  periodEnd: string;
  message: string;
};

// Deviation/missing-charge checks for fixed_expected categories only make
// sense once most of the cycle's bills have had a chance to land - our
// categories bundle several separate bills on different days (e.g. Bills &
// Utilities = insurance + power + water), so there's no single "expected
// posting day" to key off. Checking only in the closing days of the cycle
// avoids false "way under target" alerts mid-cycle before everything's in.
const FIXED_EXPECTED_CHECK_WINDOW_DAYS = 3;
const PACING_MULTIPLIER = 1.3;
const PACING_MIN_DAYS_ELAPSED = 5;
const FIXED_DEVIATION_PCT = 0.1;
const BALANCE_CAP_REFIRE_HOURS = 24;

async function sumSpend(
  supabase: SupabaseClient,
  categoryId: string,
  accountIds: string[],
  from: string,
  toExclusive: string,
): Promise<number> {
  if (accountIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("category_id", categoryId)
    .in("account_id", accountIds)
    .lt("amount", 0)
    .gte("occurred_on", from)
    .lt("occurred_on", toExclusive);
  if (error) throw error;
  return (data ?? []).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

async function getOrCreateBudgetPeriod(
  supabase: SupabaseClient,
  categoryId: string,
  periodStart: string,
  periodEnd: string,
): Promise<BudgetPeriodRow> {
  const { data: existing, error: findError } = await supabase
    .from("budget_period_alerts")
    .select("*")
    .eq("category_id", categoryId)
    .eq("period_start", periodStart)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("budget_period_alerts")
    .insert({ category_id: categoryId, period_start: periodStart, period_end: periodEnd })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

async function logAlert(
  supabase: SupabaseClient,
  categoryId: string | null,
  alertType: AlertType,
  spend: number,
  target: number | null,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("alert_log")
    .insert({ category_id: categoryId, alert_type: alertType, spend_at_fire: spend, target, message });
  if (error) throw error;
}

async function evaluateThreshold(
  supabase: SupabaseClient,
  category: CategoryAlertConfig,
  period: BudgetPeriodRow,
  spend: number,
): Promise<FiredAlert | null> {
  const target = category.monthly_limit ?? 0;
  if (target <= 0) return null;
  const hard = target * category.hard_threshold_pct;
  const soft = target * category.soft_threshold_pct;
  const pct = Math.round((spend / target) * 100);

  if (spend >= hard && !period.hard_fired) {
    const message = `${category.name}: ${fmt(spend)} of ${fmt(target)} (${pct}%) - over budget`;
    await supabase
      .from("budget_period_alerts")
      .update({ hard_fired: true, soft_fired: true })
      .eq("id", period.id);
    await logAlert(supabase, category.id, "hard", spend, target, message);
    return {
      categoryId: category.id,
      categoryName: category.name,
      alertType: "hard",
      spendSoFar: spend,
      target,
      periodEnd: period.period_end,
      message,
    };
  }

  if (spend >= soft && !period.soft_fired) {
    const message = `${category.name}: ${fmt(spend)} of ${fmt(target)} (${pct}%)`;
    await supabase.from("budget_period_alerts").update({ soft_fired: true }).eq("id", period.id);
    await logAlert(supabase, category.id, "soft", spend, target, message);
    return {
      categoryId: category.id,
      categoryName: category.name,
      alertType: "soft",
      spendSoFar: spend,
      target,
      periodEnd: period.period_end,
      message,
    };
  }

  return null;
}

async function evaluatePacing(
  supabase: SupabaseClient,
  category: CategoryAlertConfig,
  period: BudgetPeriodRow,
  spend: number,
): Promise<FiredAlert | null> {
  const target = category.monthly_limit ?? 0;
  if (target <= 0 || period.pacing_fired) return null;

  const today = new Date().toISOString().slice(0, 10);
  const daysElapsed = daysBetween(period.period_start, today);
  const daysTotal = daysBetween(period.period_start, period.period_end);
  if (daysElapsed < PACING_MIN_DAYS_ELAPSED || daysTotal <= 0) return null;

  const expectedPace = target * (daysElapsed / daysTotal);
  if (spend <= expectedPace * PACING_MULTIPLIER) return null;

  const message = `${category.name} is running ahead of pace: ${fmt(spend)} spent with ${daysTotal - daysElapsed} days left in the cycle`;
  await supabase.from("budget_period_alerts").update({ pacing_fired: true }).eq("id", period.id);
  await logAlert(supabase, category.id, "pacing", spend, target, message);
  return {
    categoryId: category.id,
    categoryName: category.name,
    alertType: "pacing",
    spendSoFar: spend,
    target,
    periodEnd: period.period_end,
    message,
  };
}

async function evaluateFixedExpected(
  supabase: SupabaseClient,
  category: CategoryAlertConfig,
  period: BudgetPeriodRow,
  spend: number,
): Promise<FiredAlert | null> {
  const target = category.monthly_limit ?? 0;
  if (target <= 0 || period.fixed_deviation_fired) return null;

  const daysUntilClose = daysBetween(new Date().toISOString().slice(0, 10), period.period_end);
  if (daysUntilClose > FIXED_EXPECTED_CHECK_WINDOW_DAYS) return null;

  if (spend === 0) {
    const message = `${category.name}: no charge seen yet this cycle (expected ~${fmt(target)})`;
    await supabase.from("budget_period_alerts").update({ fixed_deviation_fired: true }).eq("id", period.id);
    await logAlert(supabase, category.id, "fixed_deviation", spend, target, message);
    return {
      categoryId: category.id,
      categoryName: category.name,
      alertType: "fixed_deviation",
      spendSoFar: spend,
      target,
      periodEnd: period.period_end,
      message,
    };
  }

  const deviationPct = Math.abs(spend - target) / target;
  if (deviationPct <= FIXED_DEVIATION_PCT) return null;

  const direction = spend > target ? "higher" : "lower";
  const message = `${category.name}: ${fmt(spend)} vs the usual ${fmt(target)} - ${direction} than expected`;
  await supabase.from("budget_period_alerts").update({ fixed_deviation_fired: true }).eq("id", period.id);
  await logAlert(supabase, category.id, "fixed_deviation", spend, target, message);
  return {
    categoryId: category.id,
    categoryName: category.name,
    alertType: "fixed_deviation",
    spendSoFar: spend,
    target,
    periodEnd: period.period_end,
    message,
  };
}

async function evaluateBalanceCap(
  supabase: SupabaseClient,
  category: CategoryAlertConfig,
  accountIds: string[],
): Promise<FiredAlert | null> {
  const cap = category.monthly_limit ?? 0;
  if (cap <= 0 || accountIds.length === 0) return null;

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("category_id", category.id)
    .in("account_id", accountIds)
    .lt("amount", 0);
  if (error) throw error;
  const runningBalance = (data ?? []).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  if (runningBalance < cap) return null;

  const since = new Date(Date.now() - BALANCE_CAP_REFIRE_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from("alert_log")
    .select("id")
    .eq("category_id", category.id)
    .eq("alert_type", "balance_cap")
    .gte("fired_at", since)
    .limit(1);
  if (recentError) throw recentError;
  if (recent && recent.length > 0) return null;

  const message = `Uncategorised balance is ${fmt(runningBalance)} - over the ${fmt(cap)} cap, worth sorting`;
  await logAlert(supabase, category.id, "balance_cap", runningBalance, cap, message);
  return {
    categoryId: category.id,
    categoryName: category.name,
    alertType: "balance_cap",
    spendSoFar: runningBalance,
    target: cap,
    periodEnd: cycleStart(),
    message,
  };
}

// Evaluates every alert-enabled category for the current cycle, firing (and
// logging) any threshold/pacing/deviation/balance-cap alert that hasn't
// already fired this period. Called both right after an Akahu sync (so
// newly-synced transactions trigger an immediate check) and from the daily
// cron route (so pacing/fixed_expected checks still run even if nobody opens
// the app that day).
export async function evaluateAllBudgets(supabase: SupabaseClient): Promise<FiredAlert[]> {
  const period = cycleStart();
  const periodEnd = nextCycleStart(period);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, key, name, monthly_limit, alert_mode, soft_threshold_pct, hard_threshold_pct, is_trial")
    .neq("alert_mode", "none");
  if (catError) throw catError;

  const { data: accounts, error: accError } = await supabase.from("accounts").select("id").eq("is_hidden", false);
  if (accError) throw accError;
  const accountIds = (accounts ?? []).map((a: { id: string }) => a.id);

  const fired: FiredAlert[] = [];

  for (const category of (categories ?? []) as CategoryAlertConfig[]) {
    if (category.is_trial) continue;

    if (category.alert_mode === "balance_cap") {
      const alert = await evaluateBalanceCap(supabase, category, accountIds);
      if (alert) fired.push(alert);
      continue;
    }

    const budgetPeriod = await getOrCreateBudgetPeriod(supabase, category.id, period, periodEnd);
    const spend = await sumSpend(supabase, category.id, accountIds, period, periodEnd);

    if (category.alert_mode === "threshold") {
      const thresholdAlert = await evaluateThreshold(supabase, category, budgetPeriod, spend);
      if (thresholdAlert) fired.push(thresholdAlert);
      const pacingAlert = await evaluatePacing(supabase, category, budgetPeriod, spend);
      if (pacingAlert) fired.push(pacingAlert);
    } else if (category.alert_mode === "fixed_expected") {
      const deviationAlert = await evaluateFixedExpected(supabase, category, budgetPeriod, spend);
      if (deviationAlert) fired.push(deviationAlert);
    }
  }

  return fired;
}
