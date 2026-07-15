"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createMortgage(formData: FormData) {
  const supabase = await createClient();

  const lenderName = String(formData.get("lender_name") ?? "").trim() || null;
  const currentBalance = Number(formData.get("current_balance") ?? 0);
  const annualRatePct = Number(formData.get("annual_rate_pct") ?? 0);
  const monthlyPayment = Number(formData.get("monthly_payment") ?? 0);
  const originalLoanAmount = formData.get("original_loan_amount")
    ? Number(formData.get("original_loan_amount"))
    : null;

  if (!currentBalance || !annualRatePct || !monthlyPayment) {
    throw new Error("Balance, rate, and monthly payment are required");
  }

  const { error } = await supabase.from("mortgages").insert({
    lender_name: lenderName,
    current_balance: currentBalance,
    annual_rate: annualRatePct / 100,
    monthly_payment: monthlyPayment,
    original_loan_amount: originalLoanAmount,
    owner_scope: "joint",
    is_manual: true,
  });
  if (error) throw error;

  revalidatePath("/advisor");
  redirect("/advisor");
}
