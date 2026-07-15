import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fetchAkahuAccounts, fetchAkahuTransactions } from "./client";
import { applyCategoryRules } from "@/lib/data/categorization";
import { evaluateAllBudgets } from "@/lib/alerts/evaluate";
import { notifyFiredAlerts } from "@/lib/alerts/notify";
import type { AccountType } from "@/lib/types";

// Akahu's account `type` values -> ours. Anything unmapped (TERMDEPOSIT,
// FOREIGN, TAX, REWARDS, WALLET) falls back to "savings" rather than being
// silently dropped from net worth.
const TYPE_MAP: Record<string, AccountType> = {
  CHECKING: "checking",
  SAVINGS: "savings",
  CREDITCARD: "credit",
  LOAN: "loan",
  KIWISAVER: "kiwisaver",
  INVESTMENT: "investment",
};

const LIABILITY_TYPES = new Set<AccountType>(["credit", "loan"]);

export type SyncResult = {
  accountsSynced: number;
  transactionsSynced: number;
  transactionsCategorised: number;
};

// Accepts an injected client so both the manual "Sync" button (authenticated
// user session) and the daily cron route (no session - service role) can
// drive the same sync logic under whichever RLS context applies.
export async function syncAkahu(injectedClient?: SupabaseClient): Promise<SyncResult> {
  const supabase = injectedClient ?? (await createClient());

  // --- Accounts ---------------------------------------------------------
  const akahuAccounts = await fetchAkahuAccounts();
  let accountsSynced = 0;

  for (const a of akahuAccounts) {
    const type = TYPE_MAP[a.type] ?? "savings";
    // Akahu reports CREDITCARD/LOAN balances as negative (amount owed);
    // our schema stores liabilities as a positive owed-amount.
    const rawBalance = a.balance?.current ?? 0;
    const currentBalance = LIABILITY_TYPES.has(type) ? Math.abs(rawBalance) : rawBalance;

    const { data: existing, error: findError } = await supabase
      .from("accounts")
      .select("id")
      .eq("akahu_account_id", a._id)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      // Never touch owner_scope here - it's set by hand after linking and
      // syncing shouldn't clobber a manual re-scope.
      const { error } = await supabase
        .from("accounts")
        .update({
          name: a.name,
          type,
          current_balance: currentBalance,
          available_balance: a.balance?.available ?? null,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("accounts").insert({
        akahu_account_id: a._id,
        name: a.name,
        type,
        owner_scope: "joint",
        current_balance: currentBalance,
        available_balance: a.balance?.available ?? null,
        is_manual: false,
      });
      if (error) throw error;
    }
    accountsSynced++;
  }

  // --- Transactions -------------------------------------------------------
  const { data: linkedAccounts, error: linkedError } = await supabase
    .from("accounts")
    .select("id, akahu_account_id")
    .not("akahu_account_id", "is", null);
  if (linkedError) throw linkedError;
  const accountIdByAkahuId = new Map(
    (linkedAccounts ?? []).map((row) => [row.akahu_account_id as string, row.id as string]),
  );

  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "akahu_last_synced_at")
    .maybeSingle();
  const since = typeof setting?.value === "string" ? setting.value : undefined;

  const akahuTransactions = await fetchAkahuTransactions(since);
  let transactionsSynced = 0;

  for (const tx of akahuTransactions) {
    const accountId = accountIdByAkahuId.get(tx._account);
    if (!accountId) continue; // transaction on an account we don't track

    const { error } = await supabase.from("transactions").upsert(
      {
        akahu_transaction_id: tx._id,
        account_id: accountId,
        merchant_name: tx.merchant?.name ?? null,
        description: tx.description,
        // Akahu already uses our convention: negative = money out.
        amount: tx.amount,
        occurred_on: tx.date.slice(0, 10),
        is_manual: false,
      },
      { onConflict: "akahu_transaction_id" },
    );
    if (error) throw error;
    transactionsSynced++;
  }

  await supabase
    .from("app_settings")
    .upsert({ key: "akahu_last_synced_at", value: new Date().toISOString() }, { onConflict: "key" });

  const transactionsCategorised = await applyCategoryRules(supabase);

  // Fresh transactions just landed - check for newly-crossed thresholds
  // immediately rather than waiting for the next cron run.
  const firedAlerts = await evaluateAllBudgets(supabase);
  await notifyFiredAlerts(supabase, firedAlerts);

  return { accountsSynced, transactionsSynced, transactionsCategorised };
}
