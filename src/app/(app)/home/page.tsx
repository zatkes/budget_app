import Link from "next/link";
import { getAccounts } from "@/lib/data/accounts";
import { getProfiles, getCurrentProfile } from "@/lib/data/profile";
import { getGoals } from "@/lib/data/goals";
import { getTransactions } from "@/lib/data/transactions";
import { getUpcomingBills } from "@/lib/data/bills";
import { computeNetWorth, computeStatTotals } from "@/lib/finance/net-worth";
import { fmt, fmtSigned } from "@/lib/format";
import { timeOfDayGreeting } from "@/lib/date";
import { Money } from "@/components/Money";
import { CategoryIconChip, PickedIconChip } from "@/components/CategoryIcon";

const BILL_CALLOUT_COLOR: Record<string, string> = {
  overdue: "var(--negative)",
  due_soon: "#fbbf6d",
  upcoming: "var(--text-muted)",
};

function initials(profiles: Awaited<ReturnType<typeof getProfiles>>) {
  return profiles.map((p) => p.avatar_initials).join("+") || "?";
}

export default async function HomePage() {
  const [accounts, profiles, currentProfile, goals, bills] = await Promise.all([
    getAccounts(),
    getProfiles(),
    getCurrentProfile(),
    getGoals(),
    getUpcomingBills(),
  ]);
  const greetingName = currentProfile?.display_name ?? "there";

  const accountIds = accounts.map((a) => a.id);
  const recentTx = (await getTransactions(accountIds, 3)) ?? [];

  const netWorth = computeNetWorth(accounts);
  const stats = computeStatTotals(accounts);
  const topGoals = goals.slice(0, 2);
  const greeting = timeOfDayGreeting();
  const nextBill = bills.find((b) => b.daysUntilDue <= 30) ?? null;

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm capitalize" style={{ color: "var(--text-muted)" }}>
            Good {greeting}
          </div>
          <h1 className="font-display text-2xl font-bold">Hey {greetingName}</h1>
        </div>
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.5)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          {initials(profiles)}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[26px] p-6"
        style={{ background: "var(--hero-gradient)", boxShadow: "0 12px 40px rgba(124,58,237,0.45)" }}
      >
        <div
          className="pointer-events-none absolute -top-8 -right-5 h-32 w-32 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)", filter: "blur(20px)" }}
        />
        <div className="relative text-[13px] font-semibold tracking-wide text-white/75">TOTAL NET WORTH</div>
        <div className="relative font-display text-4xl font-extrabold text-white">
          <Money>{fmt(netWorth)}</Money>
        </div>
        {accounts.length === 0 && (
          <Link
            href="/accounts/new"
            className="relative mt-2 inline-block text-xs font-semibold text-white/90 underline"
          >
            Add your first account →
          </Link>
        )}
      </div>

      {nextBill && (
        <Link
          href="/budget"
          className="flex items-center gap-3 rounded-2xl border p-3.5 px-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <PickedIconChip icon={nextBill.icon} color="#7c3aed" size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{nextBill.name}</div>
            <div className="text-xs font-medium" style={{ color: BILL_CALLOUT_COLOR[nextBill.status] }}>
              {nextBill.status === "overdue"
                ? `Overdue by ${Math.abs(nextBill.daysUntilDue)}d`
                : nextBill.daysUntilDue === 0
                  ? "Due today"
                  : `Due in ${nextBill.daysUntilDue}d`}
            </div>
          </div>
          <div className="text-sm font-bold">
            <Money>{fmt(nextBill.expected_amount)}</Money>
          </div>
        </Link>
      )}

      <div className="flex gap-3">
        <div className="flex-1 rounded-[18px] border p-3.5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>Checking</div>
          <div className="font-display text-[17px] font-bold">
            <Money>{fmt(stats.checking)}</Money>
          </div>
        </div>
        <div className="flex-1 rounded-[18px] border p-3.5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>Savings</div>
          <div className="font-display text-[17px] font-bold">
            <Money>{fmt(stats.savings)}</Money>
          </div>
        </div>
        <div className="flex-1 rounded-[18px] border p-3.5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>Invested</div>
          <div className="font-display text-[17px] font-bold">
            <Money>{fmt(stats.invested)}</Money>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[17px] font-bold">Goals in progress</div>
          <Link href="/goals" className="text-sm font-semibold" style={{ color: "var(--link)" }}>
            See all
          </Link>
        </div>
        {topGoals.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No goals yet.{" "}
            <Link href="/goals/new" style={{ color: "var(--link)" }}>
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {topGoals.map((g) => (
              <div key={g.id} className="rounded-2xl border p-3.5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <PickedIconChip icon={g.icon} color="#7c3aed" size="sm" />
                    <div className="text-sm font-semibold">{g.name}</div>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    <Money>{fmt(g.savedAmount)}</Money> / <Money>{fmt(g.target_amount)}</Money>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ background: "var(--accent-gradient)", width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[17px] font-bold">Recent activity</div>
          <Link href="/activity" className="text-sm font-semibold" style={{ color: "var(--link)" }}>
            See all
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No transactions yet.{" "}
            <Link href="/activity/new" style={{ color: "var(--link)" }}>
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-2xl border p-2.5 px-3.5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <CategoryIconChip
                  categoryKey={tx.category?.key ?? "uncategorized"}
                  color={tx.category?.color ?? "#94a3b8"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{tx.merchant_name ?? tx.description ?? "Transaction"}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{tx.category?.name ?? "Uncategorised"}</div>
                </div>
                <div className="text-sm font-bold" style={{ color: tx.amount >= 0 ? "var(--positive)" : "var(--neg-text)" }}>
                  <Money>{fmtSigned(tx.amount)}</Money>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/accounts" className="text-xs" style={{ color: "var(--text-muted)" }}>
        Manage accounts →
      </Link>
    </div>
  );
}
