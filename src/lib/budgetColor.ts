// Budget progress bar color/glow, driven by % of limit used - pale purple at
// low usage, more saturated and more intensely glowing as it approaches the
// limit, shifting to magenta-red once over budget. Ported from the design
// handoff's purpleForPct/glowForPct reference implementation.

export function purpleForPct(rawPct: number): string {
  const p = Math.min(rawPct, 130);
  if (p <= 100) {
    const lightness = 74 - (p / 100) * 28;
    const sat = 55 + (p / 100) * 25;
    return `hsl(265, ${sat}%, ${lightness}%)`;
  }
  const over = Math.min(p - 100, 30);
  const hue = 265 + over * 3;
  return `hsl(${hue}, 82%, 48%)`;
}

export function glowForPct(rawPct: number): string {
  const p = Math.min(rawPct, 130);
  const alpha = 0.15 + (Math.min(p, 100) / 100) * 0.4 + (p > 100 ? 0.15 : 0);
  const rgb = p > 100 ? "236,72,153" : "139,92,246";
  return `0 0 ${8 + p / 10}px rgba(${rgb},${alpha.toFixed(2)})`;
}
