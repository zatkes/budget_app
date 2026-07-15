import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CategoryRule = {
  id: string;
  pattern: string;
  category_id: string;
  category: { key: string; name: string; color: string } | null;
};

export async function getCategoryRules(): Promise<CategoryRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("category_rules")
    .select("id, pattern, category_id, category:categories(key, name, color)")
    .order("created_at");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    category: Array.isArray(row.category) ? (row.category[0] ?? null) : row.category,
  })) as CategoryRule[];
}

// Matches every uncategorised transaction's merchant/description against the
// rule set (case-insensitive substring match) and assigns the first hit.
// Never overwrites a transaction that already has a category - manual
// corrections and prior rule matches are left alone.
export async function applyCategoryRules(injectedClient?: SupabaseClient): Promise<number> {
  const supabase = injectedClient ?? (await createClient());

  const { data: rules, error: rulesError } = await supabase
    .from("category_rules")
    .select("pattern, category_id");
  if (rulesError) throw rulesError;
  if (!rules || rules.length === 0) return 0;

  const { data: uncategorised, error: txError } = await supabase
    .from("transactions")
    .select("id, merchant_name, description")
    .is("category_id", null);
  if (txError) throw txError;
  if (!uncategorised || uncategorised.length === 0) return 0;

  let updated = 0;
  for (const tx of uncategorised) {
    const haystack = `${tx.merchant_name ?? ""} ${tx.description ?? ""}`.toLowerCase();
    const match = rules.find((rule) => haystack.includes(rule.pattern.toLowerCase()));
    if (!match) continue;

    const { error } = await supabase
      .from("transactions")
      .update({ category_id: match.category_id })
      .eq("id", tx.id);
    if (error) throw error;
    updated++;
  }

  return updated;
}

// The merchant text a rule should be learned from - prefer merchant_name
// (usually a clean, canonical name from Akahu's enrichment) and fall back to
// the raw bank description.
function derivePattern(merchantName: string | null, description: string | null): string | null {
  const text = (merchantName ?? description ?? "").trim().toLowerCase();
  return text.length > 0 ? text : null;
}

// Sets a transaction's category by hand and learns from it: upserts a rule
// keyed on that transaction's own merchant text, so the same merchant
// auto-categorises next time it comes in - and immediately sweeps any other
// currently-uncategorised transactions that match the same pattern.
export async function setTransactionCategoryAndLearn(
  transactionId: string,
  categoryId: string,
): Promise<{ ruleLearned: boolean; sweptCount: number }> {
  const supabase = await createClient();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("merchant_name, description")
    .eq("id", transactionId)
    .single();
  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", transactionId);
  if (updateError) throw updateError;

  const pattern = derivePattern(tx.merchant_name, tx.description);
  if (!pattern) return { ruleLearned: false, sweptCount: 0 };

  const { error: ruleError } = await supabase
    .from("category_rules")
    .upsert({ pattern, category_id: categoryId }, { onConflict: "pattern" });
  if (ruleError) throw ruleError;

  const sweptCount = await applyCategoryRules(supabase);
  return { ruleLearned: true, sweptCount };
}
