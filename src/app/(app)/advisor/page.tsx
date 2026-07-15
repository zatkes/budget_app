import Link from "next/link";
import { Bot } from "lucide-react";
import { getMortgages, getAssumedMarketReturn } from "@/lib/data/mortgage";
import { fmt } from "@/lib/format";
import { MortgageVsInvestTool } from "@/components/MortgageVsInvestTool";
import { Money } from "@/components/Money";

export default async function AdvisorPage() {
  const [mortgages, assumedMarketReturn] = await Promise.all([getMortgages(), getAssumedMarketReturn()]);

  const totalBalance = mortgages.reduce((sum, m) => sum + m.current_balance, 0);
  const totalPayment = mortgages.reduce((sum, m) => sum + m.monthly_payment, 0);
  const blendedRate =
    totalBalance > 0
      ? mortgages.reduce((sum, m) => sum + m.annual_rate * m.current_balance, 0) / totalBalance
      : 0;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Advisor</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your money&apos;s game plan, remixed nightly
        </p>
      </div>

      <div
        className="flex items-start gap-2.5 rounded-2xl border p-3.5 px-4"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        <Bot size={19} className="flex-shrink-0" style={{ color: "var(--link)" }} />
        <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          AI-generated suggestions, not financial advice. Always sanity-check big moves with a real advisor.
        </div>
      </div>

      <div>
        <div className="mb-3 font-display text-[17px] font-bold">This fortnight&apos;s picks</div>
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          The AI advisor job (real market data + Claude) isn&apos;t wired up yet - that&apos;s a later
          milestone. This section will show ranked stock/crypto picks with reasoning and confidence once
          it&apos;s live.
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="font-display text-[17px] font-bold">
            Your mortgage{mortgages.length > 1 ? "s" : ""}
          </div>
          {mortgages.length > 0 && (
            <Link href="/advisor/mortgage/new" className="text-sm font-semibold" style={{ color: "var(--link)" }}>
              + Add portion
            </Link>
          )}
        </div>

        {mortgages.length === 0 ? (
          <div
            className="rounded-2xl border p-5 text-sm"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
          >
            No mortgage set up yet.{" "}
            <Link href="/advisor/mortgage/new" style={{ color: "var(--link)" }}>
              Add yours
            </Link>{" "}
            to see the payoff tracker and the mortgage-vs-invest tool.
          </div>
        ) : (
          <>
            {mortgages.length > 1 && (
              <div
                className="rounded-2xl border p-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Combined across {mortgages.length} portions
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="font-display text-lg font-bold">
                    <Money>{fmt(totalBalance)}</Money>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {(blendedRate * 100).toFixed(2)}% blended · <Money>{fmt(totalPayment)}</Money>/mo total
                  </div>
                </div>
              </div>
            )}

            {mortgages.map((mortgage, i) => {
              const paidPct =
                mortgage.original_loan_amount && mortgage.original_loan_amount > 0
                  ? Math.round((1 - mortgage.current_balance / mortgage.original_loan_amount) * 100)
                  : null;

              return (
                <div key={mortgage.id} className="flex flex-col gap-3">
                  {mortgages.length > 1 && (
                    <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {mortgage.lender_name ?? `Portion ${i + 1}`}
                    </div>
                  )}

                  <div
                    className="rounded-[22px] p-5"
                    style={{ background: "var(--hero-gradient)", boxShadow: "0 12px 40px rgba(124,58,237,0.4)" }}
                  >
                    <div className="mb-2.5 flex items-baseline justify-between">
                      <div>
                        <div className="mb-0.5 text-xs text-white/75">Remaining balance</div>
                        <div className="font-display text-[26px] font-extrabold text-white">
                          <Money>{fmt(mortgage.current_balance)}</Money>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-0.5 text-xs text-white/75">Rate</div>
                        <div className="text-base font-bold text-white">
                          {(mortgage.annual_rate * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    {paidPct !== null && (
                      <>
                        <div className="mb-2 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                          <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, paidPct)}%` }} />
                        </div>
                        <div className="text-xs text-white/80">
                          {paidPct}% paid off · <Money>{fmt(mortgage.monthly_payment)}</Money>/mo payment
                        </div>
                      </>
                    )}
                  </div>

                  <MortgageVsInvestTool
                    balance={mortgage.current_balance}
                    annualRate={mortgage.annual_rate}
                    payment={mortgage.monthly_payment}
                    assumedMarketReturn={assumedMarketReturn}
                  />
                </div>
              );
            })}

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Assumes a fixed {(assumedMarketReturn * 100).toFixed(0)}% long-term market return and one
              constant mortgage rate per portion for the life of the loan - real NZ mortgages typically
              reset every 1–5 years, so treat the payoff timeline as a rough guide, not a guarantee.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
