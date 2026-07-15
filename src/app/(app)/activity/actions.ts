"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyCategoryRules, setTransactionCategoryAndLearn } from "@/lib/data/categorization";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") ?? "");
  const merchantName = String(formData.get("merchant_name") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const direction = String(formData.get("direction") ?? "expense");
  const magnitude = Math.abs(Number(formData.get("amount") ?? 0));
  const occurredOn = String(formData.get("occurred_on") ?? "");

  if (!accountId || !merchantName || !occurredOn) {
    throw new Error("Account, merchant, and date are required");
  }

  const amount = direction === "income" ? magnitude : -magnitude;

  const { error } = await supabase.from("transactions").insert({
    account_id: accountId,
    merchant_name: merchantName,
    amount,
    occurred_on: occurredOn,
    category_id: categoryId,
    is_manual: true,
  });
  if (error) throw error;

  revalidatePath("/activity");
  revalidatePath("/home");
  revalidatePath("/budget");
  redirect("/activity");
}

export async function createCategoryRule(formData: FormData) {
  const supabase = await createClient();

  const pattern = String(formData.get("pattern") ?? "").trim().toLowerCase();
  const categoryId = String(formData.get("category_id") ?? "");

  if (!pattern || !categoryId) throw new Error("Pattern and category are required");

  const { error } = await supabase
    .from("category_rules")
    .upsert({ pattern, category_id: categoryId }, { onConflict: "pattern" });
  if (error) throw error;

  revalidatePath("/activity/rules");
  redirect("/activity/rules");
}

// Sets one transaction's category by hand and learns a rule from it, so the
// same merchant auto-categorises correctly from now on.
export async function setTransactionCategory(transactionId: string, categoryId: string) {
  await setTransactionCategoryAndLearn(transactionId, categoryId);

  revalidatePath("/activity");
  revalidatePath("/home");
  revalidatePath("/budget");
}

export async function recategoriseNow() {
  const updated = await applyCategoryRules();

  revalidatePath("/activity");
  revalidatePath("/activity/rules");
  revalidatePath("/home");
  revalidatePath("/budget");

  redirect(`/activity/rules?recategorised=${updated}`);
}
