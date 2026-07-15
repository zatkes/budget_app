import Link from "next/link";
import { getCategories } from "@/lib/data/categories";
import { createRecurringBill } from "../../actions";
import { IconPicker } from "@/components/IconPicker";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewRecurringBillPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/budget" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Track an irregular bill</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Council rates, car rego, WOF, insurance renewals, servicing - anything that doesn&apos;t
        come every cycle but you know is coming.
      </p>

      <form action={createRecurringBill} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input name="name" required placeholder="Council rates" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          Icon
          <IconPicker name="icon" defaultValue="Calendar" />
        </div>

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

        <label className="flex flex-col gap-1.5 text-sm">
          Expected amount
          <input type="number" step="0.01" name="expected_amount" required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          How often (months)
          <select name="frequency_months" defaultValue="12" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
            <option value="1">Monthly</option>
            <option value="3">Every 3 months</option>
            <option value="6">Every 6 months</option>
            <option value="12">Yearly</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Next due date
          <input type="date" name="next_due_on" defaultValue={todayStr()} required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          Track this bill
        </button>
      </form>
    </div>
  );
}
