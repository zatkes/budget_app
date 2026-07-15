import Link from "next/link";
import { getCategoryRules } from "@/lib/data/categorization";
import { getCategories } from "@/lib/data/categories";
import { createCategoryRule, recategoriseNow } from "../actions";
import { CategoryIconChip } from "@/components/CategoryIcon";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

export default async function CategoryRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ recategorised?: string }>;
}) {
  const [rules, categories] = await Promise.all([getCategoryRules(), getCategories()]);
  const { recategorised } = await searchParams;

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      <Link href="/activity" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold">Categorisation rules</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          When a merchant name or description contains one of these (not case-sensitive), that
          transaction gets the matching category automatically - on every future sync, and
          retroactively when you hit &quot;Recategorise now&quot;.
        </p>
      </div>

      {recategorised !== undefined && (
        <div
          className="rounded-2xl border p-3.5 text-sm"
          style={{ background: "var(--chip-bg)", borderColor: "var(--card-border)" }}
        >
          Categorised {recategorised} previously-uncategorised transaction
          {recategorised === "1" ? "" : "s"}.
        </div>
      )}

      <form action={recategoriseNow}>
        <button
          type="submit"
          className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          Recategorise existing transactions now
        </button>
      </form>

      <div>
        <div className="mb-3 font-display text-[17px] font-bold">Add a rule</div>
        <form action={createCategoryRule} className="flex flex-col gap-3">
          <input
            name="pattern"
            required
            placeholder="e.g. vetora, bp, dog daycare"
            className="rounded-2xl border px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
          <div className="flex gap-2">
            <select
              name="category_id"
              className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none"
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              style={{ background: "var(--accent-gradient)" }}
            >
              Add
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-3 font-display text-[17px] font-bold">Existing rules ({rules.length})</div>
        {rules.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No rules yet - add merchant keywords above as they show up in Activity.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-2xl border p-3 px-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <code className="text-sm">{rule.pattern}</code>
                <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <CategoryIconChip
                    categoryKey={rule.category?.key ?? "uncategorized"}
                    color={rule.category?.color ?? "#94a3b8"}
                    size="sm"
                  />
                  {rule.category?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
