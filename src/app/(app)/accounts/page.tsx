import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getAccounts } from "@/lib/data/accounts";
import { fmt } from "@/lib/format";
import { Money } from "@/components/Money";
import { updateAccountBalance, syncAkahuNow } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  investment: "Investment",
  kiwisaver: "KiwiSaver",
  loan: "Loan",
  credit: "Credit card",
};

const SCOPE_LABEL: Record<string, string> = { joint: "Joint", sim: "Sim", lucia: "Lucia" };

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string; synced_tx?: string; synced_cat?: string }>;
}) {
  const accounts = await getAccounts();
  const { synced, synced_tx, synced_cat } = await searchParams;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Accounts</h1>
        <Link
          href="/accounts/new"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_4px_14px_rgba(139,92,246,0.5)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          +
        </Link>
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Every screen (Home, Budget, Invest, Goals) reads its numbers from these accounts.
        Accounts marked &quot;Akahu&quot; sync automatically; anything else is updated by hand.
      </p>

      {synced !== undefined && (
        <div
          className="rounded-2xl border p-3.5 text-sm"
          style={{ background: "var(--chip-bg)", borderColor: "var(--card-border)" }}
        >
          Synced {synced} account{synced === "1" ? "" : "s"} and {synced_tx} transaction
          {synced_tx === "1" ? "" : "s"} from Akahu ({synced_cat} auto-categorised).
        </div>
      )}

      <form action={syncAkahuNow}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)]"
          style={{ background: "var(--accent-gradient)" }}
        >
          <RefreshCw size={15} /> Sync bank data (Akahu)
        </button>
      </form>

      {accounts.length === 0 ? (
        <div
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          No accounts yet.{" "}
          <Link href="/accounts/new" className="font-semibold" style={{ color: "var(--link)" }}>
            Add one manually
          </Link>{" "}
          or use the sync button above if Akahu is already connected.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border p-4"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {TYPE_LABEL[a.type] ?? a.type} · {SCOPE_LABEL[a.owner_scope] ?? a.owner_scope}
                    {!a.is_manual && " · Akahu"}
                  </div>
                </div>
                <div className="font-display text-sm font-bold">
                  <Money>{fmt(a.current_balance)}</Money>
                </div>
              </div>

              {a.is_manual && (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await updateAccountBalance(a.id, Number(formData.get("current_balance")));
                  }}
                  className="mt-3 flex items-center gap-2"
                >
                  <input
                    type="number"
                    step="0.01"
                    name="current_balance"
                    defaultValue={a.current_balance}
                    className="w-32 rounded-xl border px-3 py-1.5 text-sm outline-none"
                    style={{ background: "var(--chip-bg)", borderColor: "var(--card-border)", color: "var(--text)" }}
                  />
                  <button
                    type="submit"
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: "var(--card-border)", color: "var(--link)" }}
                  >
                    Update balance
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
