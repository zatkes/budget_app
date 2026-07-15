export function monthStart(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function nextMonthStart(monthStartStr: string): string {
  const [year, month] = monthStartStr.split("-").map(Number);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${String(next.m).padStart(2, "0")}-01`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Budget "months" follow the Amex statement cycle (18th -> 17th) rather than
// the calendar month, since that's the household's primary spend card.
export function cycleStart(date: Date = new Date(), anchorDay = 18): string {
  const day = date.getDate();
  let year = date.getFullYear();
  let month = date.getMonth(); // 0-indexed
  if (day < anchorDay) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return `${year}-${pad(month + 1)}-${pad(anchorDay)}`;
}

export function nextCycleStart(cycleStartStr: string): string {
  const [year, month, day] = cycleStartStr.split("-").map(Number);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return `${next.y}-${pad(next.m)}-${pad(day)}`;
}

export function prevCycleStart(cycleStartStr: string): string {
  const [year, month, day] = cycleStartStr.split("-").map(Number);
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  return `${prev.y}-${pad(prev.m)}-${pad(day)}`;
}

export function cycleShortLabel(cycleStartStr: string): string {
  const d = new Date(cycleStartStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", { month: "short" });
}

// How many cycles before currentPeriod a given (earlier) period sits - 0 if
// they're the same cycle, 1 for the cycle immediately before it, etc.
export function cyclesAgo(period: string, currentPeriod: string): number {
  let count = 0;
  let cursor = period;
  while (cursor < currentPeriod) {
    count++;
    cursor = nextCycleStart(cursor);
  }
  return count;
}

export function cycleLabel(cycleStartStr: string): string {
  const start = new Date(cycleStartStr + "T00:00:00");
  const endExclusive = new Date(nextCycleStart(cycleStartStr) + "T00:00:00");
  const end = new Date(endExclusive);
  end.setDate(end.getDate() - 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + "T00:00:00");
  const to = new Date(toDateStr + "T00:00:00");
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Use Date's own month-overflow normalisation (e.g. Jan 31 + 1mo -> Mar 3,
  // not an invalid Feb 31) rather than reimplementing calendar maths by hand.
  const d = new Date(year, month - 1 + months, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeOfDayGreeting(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
