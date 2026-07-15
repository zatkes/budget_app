import Link from "next/link";
import { getAccounts } from "@/lib/data/accounts";
import { addHolding } from "../actions";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

export default async function NewHoldingPage() {
  const accounts = await getAccounts();
  const investmentAccounts = accounts.filter((a) => a.type === "investment" || a.type === "kiwisaver");

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/invest" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Add a holding</h1>

      {investmentAccounts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You need an investment or KiwiSaver account first.{" "}
          <Link href="/accounts/new" style={{ color: "var(--link)" }}>
            Add one
          </Link>
          .
        </p>
      ) : (
        <form action={addHolding} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Account
            <select name="account_id" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
              {investmentAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input name="name" required placeholder="S&P 500 Index Fund" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Ticker (optional)
            <input name="ticker" placeholder="VOO" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Quantity / units
            <input type="number" step="0.000001" name="quantity" defaultValue={0} className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Cost basis (optional, what you paid)
            <input type="number" step="0.01" name="cost_basis" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Current value
            <input type="number" step="0.01" name="current_value" defaultValue={0} className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
            style={{ background: "var(--accent-gradient)" }}
          >
            Add holding
          </button>
        </form>
      )}
    </div>
  );
}
