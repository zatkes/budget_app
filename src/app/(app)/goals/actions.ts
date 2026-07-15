"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "Target").trim();
  const targetAmount = Number(formData.get("target_amount") ?? 0);
  const targetDate = formData.get("target_date") ? String(formData.get("target_date")) : null;
  const linkedAccountId = formData.get("linked_account_id") || null;
  const manualSavedAmount = linkedAccountId ? null : Number(formData.get("manual_saved_amount") ?? 0);

  if (!name || !targetAmount) throw new Error("Name and target amount are required");

  const { error } = await supabase.from("goals").insert({
    name,
    icon,
    target_amount: targetAmount,
    target_date: targetDate,
    owner_scope: "joint",
    linked_account_id: linkedAccountId,
    manual_saved_amount: manualSavedAmount,
  });
  if (error) throw error;

  revalidatePath("/goals");
  revalidatePath("/home");
  redirect("/goals");
}

export async function updateGoalSavedAmount(goalId: string, savedAmount: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update({ manual_saved_amount: savedAmount }).eq("id", goalId);
  if (error) throw error;

  revalidatePath("/goals");
  revalidatePath("/home");
}
