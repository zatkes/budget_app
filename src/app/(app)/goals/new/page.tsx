import Link from "next/link";
import { getAccounts } from "@/lib/data/accounts";
import { createGoal } from "../actions";
import { IconPicker } from "@/components/IconPicker";

const inputStyle = {
  background: "var(--card-bg)",
  borderColor: "var(--card-border)",
  color: "var(--text)",
} as const;

export default async function NewGoalPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/goals" className="text-sm" style={{ color: "var(--link)" }}>
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Add a goal</h1>

      <form action={createGoal} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input name="name" required placeholder="Bali Trip 2027" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          Icon
          <IconPicker name="icon" defaultValue="Target" />
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          Target amount
          <input type="number" step="1" name="target_amount" required className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Target date (optional - leave blank for ongoing)
          <input type="date" name="target_date" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Track progress via an account (optional)
          <select name="linked_account_id" defaultValue="" className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle}>
            <option value="">None - I&apos;ll enter the saved amount manually</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Saved so far (ignored if you picked an account above)
          <input type="number" step="1" name="manual_saved_amount" defaultValue={0} className="rounded-2xl border px-4 py-3 text-sm outline-none" style={inputStyle} />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          Add goal
        </button>
      </form>
    </div>
  );
}
