import { createClient } from "@/lib/supabase/server";
import { cycleStart, nextCycleStart, prevCycleStart, cycleShortLabel } from "@/lib/date";
import { pctOf } from "@/lib/format";
import type { Category } from "@/lib/types";

export type CategorySpend = Category & { limitAmount: number; spent: number; pct: number };

export async function getBudgetCategoriesWithSpend(
  period: string = cycleStart(),
): Promise<CategorySpend[]> {
  const supabase = await createClient();

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, key, name, emoji, color, is_budgetable, is_transfer, is_sinking_fund, monthly_limit")
    .eq("is_budgetable", true);
  if (catError) throw catError;

  const { data: accounts, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("is_hidden", false);
  if (accountError) throw accountError;
  const accountIds = (accounts ?? []).map((a) => a.id);

  const spendByCategory = new Map<string, number>();
  if (accountIds.length > 0) {
    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .in("account_id", accountIds)
      .lt("amount", 0)
      .gte("occurred_on", period)
      .lt("occurred_on", nextCycleStart(period));
    if (txError) throw txError;
    for (const tx of txs ?? []) {
      if (!tx.category_id) continue;
      spendByCategory.set(
        tx.category_id,
        (spendByCategory.get(tx.category_id) ?? 0) + Math.abs(tx.amount),
      );
    }
  }

  return (categories ?? []).map((c) => {
    const limitAmount = c.monthly_limit ?? 0;
    const spent = spendByCategory.get(c.id) ?? 0;
    return { ...c, limitAmount, spent, pct: pctOf(spent, limitAmount) };
  });
}

export type CyclePoint = {
  period: string;
  label: string;
  totalSpent: number;
  totalLimit: number;
  byCategory: Record<string, number>;
};

// Spend for the last `cycleCount` cycles (oldest first), per-category,
// compared against each category's current standing limit - not a limit
// frozen at that historical point in time.
export async function getSpendHistory(
  cycleCount = 6,
): Promise<{ points: CyclePoint[]; categories: Category[] }> {
  const supabase = await createClient();

  const periods: string[] = [];
  let cursor = cycleStart();
  for (let i = 0; i < cycleCount; i++) {
    periods.unshift(cursor);
    cursor = prevCycleStart(cursor);
  }
  const earliest = periods[0];
  const rangeEnd = nextCycleStart(periods[periods.length - 1]);

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, key, name, emoji, color, is_budgetable, is_transfer, is_sinking_fund, monthly_limit")
    .eq("is_budgetable", true);
  if (catError) throw catError;

  const totalLimit = (categories ?? []).reduce((sum, c) => sum + (c.monthly_limit ?? 0), 0);
  const budgetableIds = new Set((categories ?? []).map((c) => c.id));

  const { data: accounts, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("is_hidden", false);
  if (accountError) throw accountError;
  const accountIds = (accounts ?? []).map((a) => a.id);

  let txs: { category_id: string | null; amount: number; occurred_on: string }[] = [];
  if (accountIds.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .select("category_id, amount, occurred_on")
      .in("account_id", accountIds)
      .lt("amount", 0)
      .gte("occurred_on", earliest)
      .lt("occurred_on", rangeEnd);
    if (error) throw error;
    txs = data ?? [];
  }

  const points: CyclePoint[] = periods.map((period) => {
    const periodEnd = nextCycleStart(period);
    const byCategory: Record<string, number> = {};
    let totalSpent = 0;

    for (const tx of txs) {
      if (tx.occurred_on < period || tx.occurred_on >= periodEnd) continue;
      if (!tx.category_id || !budgetableIds.has(tx.category_id)) continue;
      const amount = Math.abs(tx.amount);
      totalSpent += amount;
      byCategory[tx.category_id] = (byCategory[tx.category_id] ?? 0) + amount;
    }

    return { period, label: cycleShortLabel(period), totalSpent, totalLimit, byCategory };
  });

  return { points, categories: categories ?? [] };
}

// Sinking-fund reserve per category: the running buffer built up (or drawn
// down) across every *closed* past cycle - the standing limit banks the
// difference each cycle instead of resetting to zero. The still-open current
// cycle is deliberately excluded since it hasn't finished yet.
export async function getSinkingFundReserves(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const currentPeriod = cycleStart();

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, monthly_limit")
    .eq("is_budgetable", true)
    .eq("is_sinking_fund", true);
  if (catError) throw catError;
  if (!categories || categories.length === 0) return {};

  // Reserves only bank cycles that closed *after* sinking-fund tracking
  // actually started - not retroactively over whatever transaction history
  // Akahu happened to pull in before any standing limit existed.
  const { data: settingRow, error: settingError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "sinking_fund_start_period")
    .maybeSingle();
  if (settingError) throw settingError;
  const startPeriod = typeof settingRow?.value === "string" ? settingRow.value : currentPeriod;

  let closedCycles = 0;
  let cursor = startPeriod;
  while (cursor < currentPeriod) {
    closedCycles++;
    cursor = nextCycleStart(cursor);
  }
  if (closedCycles === 0) return {};

  const { data: accounts, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("is_hidden", false);
  if (accountError) throw accountError;
  const accountIds = (accounts ?? []).map((a) => a.id);
  if (accountIds.length === 0) return {};

  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .in("account_id", accountIds)
    .lt("amount", 0)
    .gte("occurred_on", startPeriod)
    .lt("occurred_on", currentPeriod);
  if (txError) throw txError;

  const spentByCategory = new Map<string, number>();
  for (const tx of txs ?? []) {
    if (!tx.category_id) continue;
    spentByCategory.set(tx.category_id, (spentByCategory.get(tx.category_id) ?? 0) + Math.abs(tx.amount));
  }

  const reserves: Record<string, number> = {};
  for (const c of categories) {
    const limit = c.monthly_limit ?? 0;
    const spent = spentByCategory.get(c.id) ?? 0;
    reserves[c.id] = closedCycles * limit - spent;
  }
  return reserves;
}
