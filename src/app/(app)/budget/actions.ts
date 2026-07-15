"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMonths } from "@/lib/date";
import { setHouseholdIncome } from "@/lib/data/cashflow";

export async function setBudgetLimit(categoryId: string, limitAmount: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ monthly_limit: limitAmount })
    .eq("id", categoryId);
  if (error) throw error;

  revalidatePath("/budget");
  revalidatePath("/budget/trends");
  revalidatePath("/home");
}

export async function setHouseholdIncomeEstimate(amount: number) {
  await setHouseholdIncome(amount);
  revalidatePath("/budget/trends");
}

export async function createRecurringBill(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "Calendar").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const expectedAmount = Number(formData.get("expected_amount") ?? 0);
  const frequencyMonths = Number(formData.get("frequency_months") ?? 12);
  const nextDueOn = String(formData.get("next_due_on") ?? "");

  if (!name || !expectedAmount || !nextDueOn) {
    throw new Error("Name, expected amount, and next due date are required");
  }

  const { error } = await supabase.from("recurring_bills").insert({
    name,
    icon,
    category_id: categoryId,
    expected_amount: expectedAmount,
    frequency_months: frequencyMonths,
    next_due_on: nextDueOn,
    owner_scope: "joint",
  });
  if (error) throw error;

  revalidatePath("/budget");
  revalidatePath("/home");
  redirect("/budget");
}

export async function markBillPaid(billId: string, nextDueOn: string, frequencyMonths: number) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("recurring_bills")
    .update({ last_paid_on: today, next_due_on: addMonths(nextDueOn, frequencyMonths) })
    .eq("id", billId);
  if (error) throw error;

  revalidatePath("/budget");
  revalidatePath("/home");
}
