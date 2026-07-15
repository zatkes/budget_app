import Link from "next/link";
import { getGoals } from "@/lib/data/goals";
import { fmt } from "@/lib/format";
import { Money } from "@/components/Money";
import { PickedIconChip } from "@/components/CategoryIcon";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Goals</h1>
        <Link
          href="/goals/new"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,0.5)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          +
        </Link>
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Every dollar&apos;s got a destination
      </p>

      {goals.length === 0 ? (
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          No goals yet.{" "}
          <Link href="/goals/new" style={{ color: "var(--link)" }}>
            Add your first one
          </Link>
          .
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {goals.map((g) => (
            <div
              key={g.id}
              className="rounded-[18px] border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PickedIconChip icon={g.icon} color="#7c3aed" size="sm" />
                  <div>
                    <div className="text-[15px] font-bold">{g.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Target:{" "}
                      {g.target_date
                        ? new Date(g.target_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "Ongoing"}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] font-bold" style={{ color: "var(--link)" }}>
                  {g.pct}%
                </div>
              </div>
              <div className="mb-2 h-[9px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ background: "var(--accent-gradient)", width: `${g.pct}%` }} />
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                <Money>{fmt(g.savedAmount)}</Money> saved of <Money>{fmt(g.target_amount)}</Money>
                {g.linked_account_id && " · tracked via linked account"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
