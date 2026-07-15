import { createClient } from "@/lib/supabase/server";

export type TransactionRow = {
  id: string;
  amount: number;
  occurred_on: string;
  merchant_name: string | null;
  description: string | null;
  category_id: string | null;
  category: { key: string; name: string; color: string } | null;
  account: { owner_scope: "joint" | "sim" | "lucia"; name: string } | null;
};

export type TransactionFilters = {
  categoryId?: string;
  /** Cycle start (inclusive) */
  from?: string;
  /** Cycle end (exclusive) */
  to?: string;
};

export async function getTransactions(
  accountIds: string[],
  limit = 200,
  filters: TransactionFilters = {},
): Promise<TransactionRow[]> {
  if (accountIds.length === 0) return [];

  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, amount, occurred_on, merchant_name, description, category_id, category:categories(key, name, color, is_transfer), account:accounts(owner_scope, name)",
    )
    .in("account_id", accountIds);

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.from) query = query.gte("occurred_on", filters.from);
  if (filters.to) query = query.lt("occurred_on", filters.to);

  const { data, error } = await query
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  // PostgREST returns a joined single-row relation as an object, but the
  // generated types treat it as an array - normalise both shapes here.
  const rows = (data ?? []).map((row) => ({
    ...row,
    category: Array.isArray(row.category) ? (row.category[0] ?? null) : row.category,
    account: Array.isArray(row.account) ? (row.account[0] ?? null) : row.account,
  })) as (TransactionRow & { category: (TransactionRow["category"] & { is_transfer?: boolean }) | null })[];

  // Card payoffs and between-your-own-accounts transfers aren't real
  // household spend/income - keep them out of every activity feed.
  return rows
    .filter((row) => !row.category?.is_transfer)
    .map(({ category, ...rest }) => ({
      ...rest,
      category: category ? { key: category.key, name: category.name, color: category.color } : null,
    }));
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function groupByDateBucket(transactions: TransactionRow[]) {
  const today = new Date();
  const todayStr = dateOnly(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateOnly(yesterday);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = dateOnly(weekAgo);

  const buckets: { label: string; items: TransactionRow[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const tx of transactions) {
    if (tx.occurred_on === todayStr) buckets[0].items.push(tx);
    else if (tx.occurred_on === yesterdayStr) buckets[1].items.push(tx);
    else if (tx.occurred_on > weekAgoStr) buckets[2].items.push(tx);
    else buckets[3].items.push(tx);
  }

  return buckets.filter((b) => b.items.length > 0);
}
