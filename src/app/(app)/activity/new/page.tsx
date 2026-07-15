import Link from "next/link";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { createTransaction } from "../actions";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewTransactionPage() {
  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()]);

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/activity" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Add a transaction</h1>

      {accounts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You need an account first.{" "}
          <Link href="/accounts/new" style={{ color: "var(--link)" }}>
            Add one
          </Link>
          .
        </p>
      ) : (
        <form action={createTransaction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Account
            <select name="account_id" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Merchant / description
            <input name="merchant_name" required placeholder="Trader Joe's" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Category
            <select name="category_id" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-sm">
              Type
              <select name="direction" defaultValue="expense" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm">
              Amount
              <input type="number" step="0.01" name="amount" required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            Date
            <input type="date" name="occurred_on" defaultValue={todayStr()} className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
            style={{ background: "var(--accent-gradient)" }}
          >
            Add transaction
          </button>
        </form>
      )}
    </div>
  );
}
