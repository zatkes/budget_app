import { createClient } from "@/lib/supabase/server";

export type HoldingRow = {
  id: string;
  account_id: string;
  quantity: number;
  cost_basis: number | null;
  current_value: number;
  security: { ticker_symbol: string | null; name: string } | null;
};

export async function getHoldings(accountIds: string[]): Promise<HoldingRow[]> {
  if (accountIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holdings")
    .select("id, account_id, quantity, cost_basis, current_value, security:securities(ticker_symbol, name)")
    .in("account_id", accountIds)
    .order("current_value", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    security: Array.isArray(row.security) ? (row.security[0] ?? null) : row.security,
  })) as HoldingRow[];
}
