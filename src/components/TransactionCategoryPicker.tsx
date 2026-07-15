"use client";

import { useTransition } from "react";
import { setTransactionCategory } from "@/app/(app)/activity/actions";
import type { Category } from "@/lib/types";

export function TransactionCategoryPicker({
  transactionId,
  categoryId,
  categories,
}: {
  transactionId: string;
  categoryId: string | null;
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={categoryId ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const newCategoryId = e.target.value;
        if (!newCategoryId) return;
        startTransition(() => {
          setTransactionCategory(transactionId, newCategoryId);
        });
      }}
      className="rounded-lg border px-1.5 py-1 text-[11px] outline-none disabled:opacity-50"
      style={{ background: "var(--chip-bg)", borderColor: "var(--card-border)", color: "var(--text)" }}
    >
      {!categoryId && <option value="">Uncategorised</option>}
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
