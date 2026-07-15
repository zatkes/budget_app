import Link from "next/link";
import { createMortgage } from "../../actions";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

export default function NewMortgagePage() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/advisor" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Add your mortgage</h1>

      <form action={createMortgage} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Lender (optional)
          <input name="lender_name" placeholder="ASB" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Current balance
          <input type="number" step="0.01" name="current_balance" required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Original loan amount (optional - needed for the &quot;% paid off&quot; bar)
          <input type="number" step="0.01" name="original_loan_amount" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Interest rate (% per year)
          <input type="number" step="0.01" name="annual_rate_pct" required placeholder="5.85" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Monthly payment
          <input type="number" step="0.01" name="monthly_payment" required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          Add mortgage
        </button>
      </form>
    </div>
  );
}
