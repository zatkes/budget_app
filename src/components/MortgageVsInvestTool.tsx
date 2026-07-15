"use client";

import { useMemo, useState } from "react";
import { Home, TrendingUp, Lightbulb } from "lucide-react";
import { computeMortgageVsInvest, monthsToYearsMonths } from "@/lib/finance/mortgage-calc";
import { fmt } from "@/lib/format";
import { Money } from "@/components/Money";

export function MortgageVsInvestTool({
  balance,
  annualRate,
  payment,
  assumedMarketReturn,
}: {
  balance: number;
  annualRate: number;
  payment: number;
  assumedMarketReturn: number;
}) {
  const [extraPayment, setExtraPayment] = useState(300);

  const result = useMemo(
    () =>
      computeMortgageVsInvest({
        balance,
        annualRate,
        payment,
        extraPayment,
        assumedMarketReturn,
      }),
    [balance, annualRate, payment, extraPayment, assumedMarketReturn],
  );

  const payoff = monthsToYearsMonths(result.payoffMonths);
  const saved = monthsToYearsMonths(result.monthsSaved);

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="font-display text-[17px] font-bold">Mortgage vs. Invest</div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Drag to see what an extra monthly amount could do.
        </p>
      </div>

      <div
        className="rounded-[18px] border p-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Extra per month
          </div>
          <div className="font-display text-lg font-extrabold">${extraPayment}</div>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={50}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full accent-[#8b5cf6]"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <div
          className="rounded-2xl border p-3.5 px-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold">
            <Home size={14} /> Pay down the mortgage
          </div>
          <Row label="Payoff in" value={`${payoff.years}y ${payoff.months}m`} />
          <Row
            label="Time saved"
            value={result.monthsSaved > 0 ? `${saved.years}y ${saved.months}m sooner` : "No change yet - try adding extra"}
            positive
          />
          <Row label="Interest saved" value={<Money>{fmt(result.interestSaved)}</Money>} positive />
        </div>
        <div
          className="rounded-2xl border p-3.5 px-4"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold">
            <TrendingUp size={14} /> Invest the difference
          </div>
          <Row label="Projected value" value={<Money>{fmt(result.investFutureValue)}</Money>} />
          <Row label="Growth above contributions" value={<Money>{fmt(result.investGrowth)}</Money>} positive />
        </div>
      </div>

      <div
        className="flex items-start gap-2.5 rounded-2xl border p-3.5 px-4 text-sm"
        style={{ background: "var(--chip-bg)", borderColor: "var(--card-border)" }}
      >
        <div className="flex-shrink-0" style={{ color: "var(--link)" }}>
          <Lightbulb size={17} />
        </div>
        <div>
          {result.leanTowardInvest ? (
            <>
              Your mortgage rate ({(annualRate * 100).toFixed(2)}%) is below the assumed long-term market
              return ({(assumedMarketReturn * 100).toFixed(0)}%), so we lean slightly towards investing the
              extra - but paying down the mortgage is the guaranteed, stress-free option. A 50/50 split
              works great too.
            </>
          ) : (
            <>
              Your mortgage rate ({(annualRate * 100).toFixed(2)}%) is high enough that paying it down
              faster is the safer bet - that&apos;s a guaranteed return no market can promise.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: React.ReactNode; positive?: boolean }) {
  return (
    <div className="mb-1 flex justify-between text-[13px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold" style={{ color: positive ? "var(--positive)" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
