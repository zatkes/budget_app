import Link from "next/link";
import { Settings, X } from "lucide-react";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { getTransactions, groupByDateBucket } from "@/lib/data/transactions";
import { fmt, fmtSigned } from "@/lib/format";
import { cycleLabel } from "@/lib/date";
import { TransactionCategoryPicker } from "@/components/TransactionCategoryPicker";
import { Money } from "@/components/Money";
import { CategoryIconChip } from "@/components/CategoryIcon";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; from?: string; to?: string }>;
}) {
  const { category: categoryId, from, to } = await searchParams;
  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()]);
  const isFiltered = Boolean(categoryId);
  const transactions = await getTransactions(
    accounts.map((a) => a.id),
    isFiltered ? 500 : 200,
    isFiltered ? { categoryId, from, to } : {},
  );
  const groups = groupByDateBucket(transactions);
  const uncategorisedCount = transactions.filter((tx) => !tx.category).length;
  const filterCategory = isFiltered ? categories.find((c) => c.id === categoryId) : undefined;
  const filteredTotal = isFiltered ? transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) : 0;

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Activity</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Here&apos;s where it&apos;s all been going
          </p>
        </div>
        <Link
          href="/activity/new"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,0.5)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          +
        </Link>
      </div>

      {isFiltered && filterCategory && (
        <div
          className="flex items-center justify-between rounded-2xl border p-3 px-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <CategoryIconChip categoryKey={filterCategory.key} color={filterCategory.color} size="sm" />
            <div>
              <div className="text-sm font-semibold">{filterCategory.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {from ? `${cycleLabel(from)} · ` : ""}
                <Money>{fmt(filteredTotal)}</Money>
              </div>
            </div>
          </div>
          <Link
            href="/activity"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--chip-bg)" }}
            aria-label="Clear filter"
          >
            <X size={14} />
          </Link>
        </div>
      )}

      {!isFiltered && (
        <Link
          href="/activity/rules"
          className="flex items-center justify-between rounded-2xl border p-3 px-4 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <span className="flex items-center gap-1.5">
            <Settings size={15} /> Categorisation rules
          </span>
          {uncategorisedCount > 0 && (
            <span style={{ color: "var(--text-muted)" }}>{uncategorisedCount} uncategorised</span>
          )}
        </Link>
      )}

      {groups.length === 0 ? (
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          {isFiltered ? (
            from ? "No transactions in this category for this cycle." : "No transactions in this category yet."
          ) : (
            <>
              No transactions yet.{" "}
              <Link href="/activity/new" style={{ color: "var(--link)" }}>
                Add your first one
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <div
              className="mb-2.5 text-xs font-bold tracking-wide uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {group.label}
            </div>
            <div className="flex flex-col gap-2">
              {group.items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-2xl border p-[11px] px-3.5"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                  <CategoryIconChip
                    categoryKey={tx.category?.key ?? "uncategorized"}
                    color={tx.category?.color ?? "#94a3b8"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {tx.merchant_name ?? tx.description ?? "Transaction"}
                    </div>
                    <div className="mt-0.5">
                      <TransactionCategoryPicker
                        transactionId={tx.id}
                        categoryId={tx.category_id}
                        categories={categories}
                      />
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 text-sm font-bold"
                    style={{ color: tx.amount >= 0 ? "var(--positive)" : "var(--neg-text)" }}
                  >
                    <Money>{fmtSigned(tx.amount)}</Money>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
