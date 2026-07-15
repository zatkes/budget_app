"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncAkahu } from "@/lib/akahu/sync";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking");
  const currentBalance = Number(formData.get("current_balance") ?? 0);

  if (!name) throw new Error("Account name is required");

  const { error } = await supabase.from("accounts").insert({
    name,
    type,
    owner_scope: "joint",
    current_balance: currentBalance,
    is_manual: true,
  });
  if (error) throw error;

  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/invest");
  redirect("/accounts");
}

export async function updateAccountBalance(accountId: string, currentBalance: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ current_balance: currentBalance })
    .eq("id", accountId);
  if (error) throw error;

  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/invest");
}

export async function syncAkahuNow() {
  const result = await syncAkahu();

  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/invest");
  revalidatePath("/budget");
  revalidatePath("/activity");

  redirect(
    `/accounts?synced=${result.accountsSynced}&synced_tx=${result.transactionsSynced}&synced_cat=${result.transactionsCategorised}`,
  );
}
