import { createClient } from "@/lib/supabase/server";
import type { Mortgage } from "@/lib/types";

export async function getMortgages(): Promise<Mortgage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mortgages")
    .select(
      "id, owner_scope, lender_name, current_balance, annual_rate, monthly_payment, original_loan_amount, origination_date, linked_account_id",
    )
    .order("current_balance", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAssumedMarketReturn(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "assumed_market_return")
    .single();
  const value = data?.value;
  return typeof value === "number" ? value : 0.07;
}
