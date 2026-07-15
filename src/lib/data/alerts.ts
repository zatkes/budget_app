import { createClient } from "@/lib/supabase/server";

export type AlertLogRow = {
  id: string;
  category_id: string | null;
  alert_type: "soft" | "hard" | "pacing" | "fixed_deviation" | "balance_cap";
  fired_at: string;
  spend_at_fire: number;
  target: number | null;
  message: string;
  category: { key: string; name: string; color: string } | null;
};

export async function getRecentAlerts(limit = 10): Promise<AlertLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alert_log")
    .select("id, category_id, alert_type, fired_at, spend_at_fire, target, message, category:categories(key, name, color)")
    .order("fired_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    category: Array.isArray(row.category) ? (row.category[0] ?? null) : row.category,
  })) as AlertLogRow[];
}
