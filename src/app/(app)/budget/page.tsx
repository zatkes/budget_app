import Link from "next/link";
import { BarChart3, PiggyBank } from "lucide-react";
import { getBudgetCategoriesWithSpend, getSinkingFundReserves } from "@/lib/data/budgets";
import { getUpcomingBills } from "@/lib/data/bills";
import { getRecentAlerts } from "@/lib/data/alerts";
import { fmt, pctOf } from "@/lib/format";
import { cycleStart, cycleLabel, prevCycleStart, nextCycleStart, cyclesAgo } from "@/lib/date";
import { purpleForPct, glowForPct } from "@/lib/budgetColor";
import { setBudgetLimit, markBillPaid } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/Money";
import { CategoryIconChip, PickedIconChip } from "@/components/CategoryIcon";

const STATUS_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  overdue: "destructive",
  due_soon: "secondary",
  upcoming: "outline",
};

const ALERT_COLOR: Record<string, string> = {
  hard: "var(--destructive)",
  soft: "#fbbf6d",
  pacing: "#fbbf6d",
  fixed_deviation: "var(--chart-3)",
  balance_cap: "var(--text-muted)",
};

function formatAlertTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const currentPeriod = cycleStart();
  const { cycle } = await searchParams;
  const period = cycle ?? currentPeriod;
  const isCurrentCycle = period === currentPeriod;
  const cyclesBack = cyclesAgo(period, currentPeriod);

  const [categories, bills, reserves, alerts] = await Promise.all([
    getBudgetCategoriesWithSpend(period),
    isCurrentCycle ? getUpcomingBills() : Promise.resolve([]),
    isCurrentCycle ? getSinkingFundReserves() : Promise.resolve<Record<string, number>>({}),
    isCurrentCycle ? getRecentAlerts(5) : Promise.resolve([]),
  ]);

  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalLimit = categories.reduce((sum, c) => sum + c.limitAmount, 0);
  const totalPct = pctOf(totalSpent, totalLimit);
  const left = totalLimit - totalSpent;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-4">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Budget</h1>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/budget/trends" />}>
            <BarChart3 size={15} /> Trends
          </Button>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {totalLimit === 0 ? (
            "Set your category limits below to start tracking."
          ) : left >= 0 ? (
            <>
              You&apos;ve got <Money>{fmt(left)}</Money> left to have fun with this cycle
            </>
          ) : (
            <>
              You&apos;re <Money>{fmt(-left)}</Money> over budget this cycle.
            </>
          )}
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/budget?cycle=${prevCycleStart(period)}`} />}>
            ← Prev
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold">{cycleLabel(period)}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {isCurrentCycle ? "Current cycle" : `${cyclesBack} cycle${cyclesBack > 1 ? "s" : ""} ago`}
            </div>
          </div>
          {isCurrentCycle ? (
            <Button variant="ghost" size="sm" disabled>
              Next →
            </Button>
          ) : (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/budget?cycle=${nextCycleStart(period)}`} />}>
              Next →
            </Button>
          )}
        </CardContent>
      </Card>

      <div
        className="rounded-[26px] p-[22px]"
        style={{ background: "var(--hero-gradient)", boxShadow: "0 12px 40px rgba(124,58,237,0.4)" }}
      >
        <div className="mb-2.5 flex items-baseline justify-between">
          <div className="font-display text-[26px] font-extrabold text-white">
            <Money>{fmt(totalSpent)}</Money>
          </div>
          <div className="text-[13px] text-white/75">
            of <Money>{fmt(totalLimit)}</Money>
          </div>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <div className="h-full rounded-full bg-white" style={{ width: `${totalPct}%` }} />
        </div>
      </div>

      {isCurrentCycle && alerts.length > 0 && (
        <div>
          <div className="mb-2 font-display text-[17px] font-bold">Recent alerts</div>
          <div className="flex flex-col gap-2">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={
                  a.alert_type === "balance_cap"
                    ? `/activity?category=${a.category_id}`
                    : `/activity?category=${a.category_id}&from=${period}&to=${nextCycleStart(period)}`
                }
                className="flex items-start gap-2.5 rounded-2xl border p-3 px-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: ALERT_COLOR[a.alert_type] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.message}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatAlertTime(a.fired_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((c) => {
          const rawPct = c.limitAmount > 0 ? (c.spent / c.limitAmount) * 100 : 0;
          const isOver = c.limitAmount > 0 && c.spent > c.limitAmount;
          return (
            <Card key={c.id} className={isOver ? "ring-destructive/40" : undefined}>
              <CardContent className="flex flex-col gap-2.5">
                <Link
                  href={`/activity?category=${c.id}&from=${period}&to=${nextCycleStart(period)}`}
                  className="flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CategoryIconChip categoryKey={c.key} color={c.color} size="sm" />
                      <div className="text-sm font-semibold">{c.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: isOver ? "var(--destructive)" : "var(--text-muted)" }}
                      >
                        <Money>{fmt(c.spent)}</Money> / <Money>{fmt(c.limitAmount)}</Money>
                      </span>
                      {isOver && <Badge variant="destructive">Over</Badge>}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: purpleForPct(rawPct), boxShadow: glowForPct(rawPct), width: `${c.pct}%` }}
                    />
                  </div>

                  {isCurrentCycle && c.is_sinking_fund && reserves[c.id] !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <PiggyBank size={13} />
                      Reserve:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: reserves[c.id] < 0 ? "var(--destructive)" : "var(--positive)" }}
                      >
                        {reserves[c.id] < 0 ? "-" : ""}
                        <Money>{fmt(Math.abs(reserves[c.id]))}</Money>
                      </span>
                      {reserves[c.id] < 0 ? "catching up from past cycles" : "banked from past cycles"}
                    </div>
                  )}
                </Link>

                {isCurrentCycle && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await setBudgetLimit(c.id, Number(formData.get("limit")));
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      key={`${c.id}-${c.limitAmount}`}
                      type="number"
                      step="1"
                      name="limit"
                      defaultValue={c.limitAmount}
                      className="w-24"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Set standing limit
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isCurrentCycle && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="font-display text-[17px] font-bold">Coming up</div>
            <Button size="icon-sm" nativeButton={false} render={<Link href="/budget/bills/new" />} className="rounded-full">
              +
            </Button>
          </div>
          <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Irregular bills that don&apos;t come every cycle - so they stop being a surprise.
          </p>

          {bills.length === 0 ? (
            <Card>
              <CardContent className="text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing tracked yet - add council rates, rego, WOF, car services, etc.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bills.map((bill) => (
                <Card key={bill.id}>
                  <CardContent className="flex items-center gap-3">
                    <PickedIconChip icon={bill.icon} color="#7c3aed" size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{bill.name}</div>
                      <Badge variant={STATUS_VARIANT[bill.status]} className="mt-1">
                        {bill.status === "overdue"
                          ? `Overdue by ${Math.abs(bill.daysUntilDue)}d`
                          : bill.daysUntilDue === 0
                            ? "Due today"
                            : `Due in ${bill.daysUntilDue}d`}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        <Money>{fmt(bill.expected_amount)}</Money>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await markBillPaid(bill.id, bill.next_due_on, bill.frequency_months);
                        }}
                      >
                        <Button type="submit" variant="link" size="sm" className="h-auto p-0 text-xs">
                          Mark as paid
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
