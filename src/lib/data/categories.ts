import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, key, name, emoji, color, is_budgetable, is_transfer, is_sinking_fund, monthly_limit")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
