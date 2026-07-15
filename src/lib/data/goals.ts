import { createClient } from "@/lib/supabase/server";
import { pctOf } from "@/lib/format";
import type { Goal } from "@/lib/types";

export type GoalWithProgress = Goal & { savedAmount: number; pct: number };

export async function getGoals(): Promise<GoalWithProgress[]> {
  const supabase = await createClient();

  const { data: goals, error } = await supabase
    .from("goals")
    .select(
      "id, name, icon, target_amount, target_date, owner_scope, linked_account_id, manual_saved_amount, archived_at",
    )
    .is("archived_at", null)
    .order("target_date", { nullsFirst: false });
  if (error) throw error;

  const linkedIds = (goals ?? [])
    .map((g) => g.linked_account_id)
    .filter((id): id is string => Boolean(id));

  let balanceByAccount = new Map<string, number>();
  if (linkedIds.length > 0) {
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, current_balance")
      .in("id", linkedIds);
    if (accError) throw accError;
    balanceByAccount = new Map((accounts ?? []).map((a) => [a.id, a.current_balance]));
  }

  return (goals ?? []).map((g) => {
    const savedAmount = g.linked_account_id
      ? (balanceByAccount.get(g.linked_account_id) ?? 0)
      : (g.manual_saved_amount ?? 0);
    return { ...g, savedAmount, pct: pctOf(savedAmount, g.target_amount) };
  });
}
