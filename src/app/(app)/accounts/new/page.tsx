import Link from "next/link";
import { createAccount } from "../actions";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

export default function NewAccountPage() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-sm" style={{ color: "var(--link)" }}>
          ← Back
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold">Add an account</h1>

      <form action={createAccount} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input
            name="name"
            required
            placeholder="Joint Checking"
            className="rounded-2xl border px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Type
          <select name="type" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="kiwisaver">KiwiSaver</option>
            <option value="credit">Credit card</option>
            <option value="loan">Loan</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Current balance
          <input
            type="number"
            step="0.01"
            name="current_balance"
            defaultValue={0}
            className="rounded-2xl border px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          Add account
        </button>
      </form>
    </div>
  );
}
