"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addHolding(formData: FormData) {
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") ?? "");
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const costBasis = formData.get("cost_basis") ? Number(formData.get("cost_basis")) : null;
  const currentValue = Number(formData.get("current_value") ?? 0);

  if (!accountId || !name) throw new Error("Account and name are required");

  let securityId: string;
  const { data: existing } = await supabase
    .from("securities")
    .select("id")
    .eq("ticker_symbol", ticker || null)
    .maybeSingle();

  if (existing) {
    securityId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase
      .from("securities")
      .insert({ ticker_symbol: ticker || null, name, asset_class: "stock" })
      .select("id")
      .single();
    if (createError) throw createError;
    securityId = created.id;
  }

  const { error } = await supabase.from("holdings").insert({
    account_id: accountId,
    security_id: securityId,
    quantity,
    cost_basis: costBasis,
    current_value: currentValue,
  });
  if (error) throw error;

  revalidatePath("/invest");
  revalidatePath("/home");
  redirect("/invest");
}
