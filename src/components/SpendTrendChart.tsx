"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { CyclePoint } from "@/lib/data/budgets";
import { fmt } from "@/lib/format";
import { useHideValues } from "@/components/hide-values-provider";

const chartConfig = {
  totalSpent: { label: "Spent" },
} satisfies ChartConfig;

const BUBBLE_HEIGHT = 24;

function mask(s: string, hideValues: boolean): string {
  return hideValues ? s.replace(/[0-9]/g, "•") : s;
}

// Value callout above the current cycle's bar - always visible (unlike the
// shared hover tooltip) so "where we are now" reads at a glance.
function CurrentValueBubble({
  x,
  y,
  width,
  index,
  value,
  lastIndex,
  overBudget,
  hideValues,
}: {
  x: number;
  y: number;
  width: number;
  index: number;
  value: number;
  lastIndex: number;
  overBudget: boolean;
  hideValues: boolean;
}) {
  if (index !== lastIndex || Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(width) || Number.isNaN(value)) {
    return null;
  }

  const label = mask(fmt(value), hideValues);
  const bubbleWidth = Math.max(label.length * 6.5 + 16, 46);
  const cx = x + width / 2;
  const cy = y - BUBBLE_HEIGHT - 6;
  const fill = overBudget ? "var(--destructive)" : "var(--chart-1)";

  return (
    <g>
      <rect
        x={cx - bubbleWidth / 2}
        y={cy}
        width={bubbleWidth}
        height={BUBBLE_HEIGHT}
        rx={BUBBLE_HEIGHT / 2}
        fill={fill}
      />
      <polygon
        points={`${cx - 5},${cy + BUBBLE_HEIGHT} ${cx + 5},${cy + BUBBLE_HEIGHT} ${cx},${cy + BUBBLE_HEIGHT + 6}`}
        fill={fill}
      />
      <text
        x={cx}
        y={cy + BUBBLE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        fill="white"
      >
        {label}
      </text>
    </g>
  );
}

// Total spend per cycle, with a reference line at the standing budget total.
// A single series, so no legend - the current cycle is highlighted with a
// glowing value callout, and any cycle that ran over budget is called out in
// red regardless of when it was.
export function SpendTrendChart({ points }: { points: CyclePoint[] }) {
  const gradientId = useId();
  const { hideValues } = useHideValues();
  const totalLimit = points[points.length - 1]?.totalLimit ?? 0;
  const lastIndex = points.length - 1;
  const currentOverBudget = totalLimit > 0 && (points[lastIndex]?.totalSpent ?? 0) > totalLimit;

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[230px] w-full">
      <BarChart data={points} margin={{ top: 40, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          stroke="var(--muted-foreground)"
        />
        {totalLimit > 0 && (
          <ReferenceLine
            y={totalLimit}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: `Budget ${mask(fmt(totalLimit), hideValues)}`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
        )}
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideLabel={false}
              formatter={(value) => [mask(fmt(Number(value)), hideValues), " spent"]}
            />
          }
        />
        <Bar
          dataKey="totalSpent"
          radius={[4, 4, 0, 0]}
          maxBarSize={34}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts' label-renderer Props type is too broad to annotate structurally
          label={(props: any) => {
            const rawValue = Array.isArray(props.value) ? props.value[0] : props.value;
            return (
              <CurrentValueBubble
                x={Number(props.x)}
                y={Number(props.y)}
                width={Number(props.width)}
                index={props.index ?? -1}
                value={Number(rawValue)}
                lastIndex={lastIndex}
                overBudget={currentOverBudget}
                hideValues={hideValues}
              />
            );
          }}
        >
          {points.map((point, i) => {
            const isCurrent = i === lastIndex;
            const overBudget = point.totalLimit > 0 && point.totalSpent > point.totalLimit;
            const fill = overBudget ? "var(--destructive)" : `url(#${gradientId})`;
            return (
              <Cell
                key={point.period}
                fill={fill}
                opacity={isCurrent || overBudget ? 1 : 0.4}
                style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.35))" }}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
