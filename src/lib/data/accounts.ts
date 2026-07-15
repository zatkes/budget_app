import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/lib/types";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type, owner_scope, current_balance, available_balance, is_manual, is_hidden")
    .eq("is_hidden", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
