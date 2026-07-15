import { createClient } from "@/lib/supabase/server";
import { cycleStart, nextCycleStart, prevCycleStart, cycleShortLabel } from "@/lib/date";

export type CashFlowPoint = {
  period: string;
  label: string;
  mortgage: number;
  spending: number;
  totalLimit: number;
  income: number;
};

// Two segments - mortgage/loan repayments vs. everything else spent - stacked
// per cycle, against a budget line (sum of category standing limits) and an
// income line. Internal transfers (card payoffs, moving money between your
// own accounts) are the one deliberate exclusion, since counting those would
// double up spend that's already counted where it actually left the household.
export async function getCashFlowHistory(cycleCount = 6): Promise<{ points: CashFlowPoint[] }> {
  const supabase = await createClient();

  const periods: string[] = [];
  let cursor = cycleStart();
  for (let i = 0; i < cycleCount; i++) {
    periods.unshift(cursor);
    cursor = prevCycleStart(cursor);
  }
  const earliest = periods[0];
  const rangeEnd = nextCycleStart(periods[periods.length - 1]);

  const { data: allCategories, error: catError } = await supabase
    .from("categories")
    .select("id, key, monthly_limit, is_budgetable, is_transfer")
    .neq("key", "income");
  if (catError) throw catError;

  const categories = (allCategories ?? []).filter((c) => !c.is_transfer);
  const spendableIds = new Set(categories.map((c) => c.id));
  const mortgageId = categories.find((c) => c.key === "mortgage_loans")?.id ?? null;
  const totalLimit = categories.reduce((sum, c) => sum + (c.is_budgetable ? (c.monthly_limit ?? 0) : 0), 0);

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

  const { data: incomeSetting, error: incomeError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "household_income_per_cycle")
    .maybeSingle();
  if (incomeError) throw incomeError;
  const income = typeof incomeSetting?.value === "number" ? incomeSetting.value : 0;

  const points: CashFlowPoint[] = periods.map((period) => {
    const periodEnd = nextCycleStart(period);
    let mortgage = 0;
    let spending = 0;

    for (const tx of txs) {
      if (tx.occurred_on < period || tx.occurred_on >= periodEnd) continue;
      if (!tx.category_id || !spendableIds.has(tx.category_id)) continue;
      const amount = Math.abs(tx.amount);
      if (tx.category_id === mortgageId) mortgage += amount;
      else spending += amount;
    }

    return { period, label: cycleShortLabel(period), mortgage, spending, totalLimit, income };
  });

  return { points };
}

export async function getHouseholdIncomeSetting(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "household_income_per_cycle")
    .maybeSingle();
  if (error) throw error;
  return typeof data?.value === "number" ? data.value : 0;
}

export async function setHouseholdIncome(amount: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "household_income_per_cycle", value: amount }, { onConflict: "key" });
  if (error) throw error;
}
