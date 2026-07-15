import type { Account } from "@/lib/types";

const ASSET_TYPES = new Set(["checking", "savings", "investment", "kiwisaver"]);
const LIABILITY_TYPES = new Set(["loan", "credit"]);

export function sumBy(accounts: Account[], predicate: (a: Account) => boolean): number {
  return accounts.filter(predicate).reduce((sum, a) => sum + a.current_balance, 0);
}

export function computeNetWorth(accounts: Account[]): number {
  const assets = sumBy(accounts, (a) => ASSET_TYPES.has(a.type));
  const liabilities = sumBy(accounts, (a) => LIABILITY_TYPES.has(a.type));
  return assets - liabilities;
}

export function computeStatTotals(accounts: Account[]) {
  return {
    checking: sumBy(accounts, (a) => a.type === "checking"),
    savings: sumBy(accounts, (a) => a.type === "savings"),
    invested: sumBy(accounts, (a) => a.type === "investment" || a.type === "kiwisaver"),
  };
}
