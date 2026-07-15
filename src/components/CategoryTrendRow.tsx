import { TrendingUp, TrendingDown } from "lucide-react";
import type { Category } from "@/lib/types";
import type { CyclePoint } from "@/lib/data/budgets";
import { fmt } from "@/lib/format";
import { Money } from "@/components/Money";
import { CategoryIconChip } from "@/components/CategoryIcon";

const BAR_WIDTH = 12;
const GAP = 3;
const MAX_BAR_HEIGHT = 32;

// One category's spend across the same cycles as the main chart, scaled to
// its own max (small multiples - each category's magnitude is independent).
export function CategoryTrendRow({ category, points }: { category: Category; points: CyclePoint[] }) {
  const values = points.map((p) => p.byCategory[category.id] ?? 0);
  const maxValue = Math.max(...values, 1);
  const width = points.length * (BAR_WIDTH + GAP);

  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? 0;
  const delta = previous > 0 ? ((latest - previous) / previous) * 100 : null;

  if (values.every((v) => v === 0)) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-3 px-4"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <CategoryIconChip categoryKey={category.key} color={category.color} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{category.name}</div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <Money>{fmt(latest)}</Money> this cycle
          {delta !== null && delta !== 0 && (
            <span
              className="flex items-center gap-0.5 font-medium"
              style={{ color: delta > 0 ? "var(--negative)" : "var(--positive)" }}
            >
              {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(Math.round(delta))}%
            </span>
          )}
        </div>
      </div>
      <svg width={width} height={MAX_BAR_HEIGHT + 2} viewBox={`0 0 ${width} ${MAX_BAR_HEIGHT + 2}`} aria-hidden="true">
        {values.map((v, i) => {
          const h = Math.max((v / maxValue) * MAX_BAR_HEIGHT, v > 0 ? 2 : 0);
          const isLast = i === values.length - 1;
          return (
            <rect
              key={i}
              x={i * (BAR_WIDTH + GAP)}
              y={MAX_BAR_HEIGHT - h}
              width={BAR_WIDTH}
              height={h}
              rx={2.5}
              fill={category.color}
              opacity={isLast ? 1 : 0.4}
            />
          );
        })}
      </svg>
    </div>
  );
}
