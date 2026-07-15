import Link from "next/link";
import { getAccounts } from "@/lib/data/accounts";
import { getHoldings } from "@/lib/data/holdings";
import { fmt, fmtPct } from "@/lib/format";
import { Money } from "@/components/Money";

export default async function InvestPage() {
  const accounts = await getAccounts();
  const investmentAccountIds = accounts
    .filter((a) => a.type === "investment" || a.type === "kiwisaver")
    .map((a) => a.id);
  const holdings = await getHoldings(investmentAccountIds);

  const portfolioTotal = holdings.reduce((sum, h) => sum + h.current_value, 0);

  return (
    <div className="flex flex-col gap-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Investing</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your money is out there working hard
          </p>
        </div>
        <Link
          href="/invest/new"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,0.5)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          +
        </Link>
      </div>

      <div
        className="rounded-[26px] p-[22px]"
        style={{ background: "var(--hero-gradient)", boxShadow: "0 12px 40px rgba(124,58,237,0.4)" }}
      >
        <div className="mb-1.5 text-[13px] font-semibold tracking-wide text-white/75">PORTFOLIO VALUE</div>
        <div className="font-display text-[32px] font-extrabold text-white">
          <Money>{fmt(portfolioTotal)}</Money>
        </div>
      </div>

      <div className="font-display text-[17px] font-bold">Holdings</div>

      {holdings.length === 0 ? (
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          {investmentAccountIds.length === 0 ? (
            <>
              No investment accounts yet.{" "}
              <Link href="/accounts/new" style={{ color: "var(--link)" }}>
                Add one
              </Link>{" "}
              first.
            </>
          ) : (
            <>
              No holdings yet.{" "}
              <Link href="/invest/new" style={{ color: "var(--link)" }}>
                Add your first one
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {holdings.map((h) => {
            const gainLoss = h.cost_basis != null ? h.current_value - h.cost_basis : null;
            const gainLossPct = gainLoss != null && h.cost_basis ? (gainLoss / h.cost_basis) * 100 : null;
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-2xl border p-[13px] px-[15px]"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{h.security?.name ?? "Holding"}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {h.security?.ticker_symbol ?? "-"} · {h.quantity} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    <Money>{fmt(h.current_value)}</Money>
                  </div>
                  {gainLossPct != null && (
                    <div
                      className="text-xs font-semibold"
                      style={{ color: gainLoss! >= 0 ? "var(--positive)" : "var(--negative)" }}
                    >
                      {fmtPct(gainLossPct)} overall
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
