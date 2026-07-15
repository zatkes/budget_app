export function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtSigned(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number, digits = 1): string {
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}

export function pctOf(value: number, of: number): number {
  if (!of) return 0;
  return Math.min(100, Math.round((value / of) * 100));
}
