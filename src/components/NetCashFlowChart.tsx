"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { CashFlowPoint } from "@/lib/data/cashflow";
import { fmt } from "@/lib/format";
import { useHideValues } from "@/components/hide-values-provider";

const chartConfig = {} satisfies ChartConfig;

function mask(s: string, hideValues: boolean): string {
  return hideValues ? s.replace(/[0-9]/g, "•") : s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts' dot-renderer Props type is too broad to annotate structurally
function NetDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const color = payload.net >= 0 ? "var(--positive)" : "var(--negative)";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--card-bg)" strokeWidth={2} />;
}

function NetTooltip({
  active,
  payload,
  label,
  hideValues,
}: {
  active?: boolean;
  payload?: { payload: { net: number } }[];
  label?: string;
  hideValues: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const color = point.net >= 0 ? "var(--positive)" : "var(--negative)";

  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-lg"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <div className="mb-1 font-semibold">{label}</div>
      <div className="font-semibold" style={{ color }}>
        {mask(fmt(Math.abs(point.net)), hideValues)} {point.net >= 0 ? "left over" : "over income"}
      </div>
    </div>
  );
}

// What's left after everything spent, each cycle - green above the zero
// line when income covered it, coral below when it didn't.
export function NetCashFlowChart({ points }: { points: CashFlowPoint[] }) {
  const fillId = useId();
  const strokeId = useId();
  const { hideValues } = useHideValues();

  const data = points.map((p) => ({ label: p.label, net: p.income - p.mortgage - p.spending }));
  const values = data.map((d) => d.net);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const zeroOffset = Math.min(1, Math.max(0, max / range));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
      <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zeroOffset} stopColor="#34d399" stopOpacity={0.35} />
            <stop offset={zeroOffset} stopColor="#fb7185" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zeroOffset} stopColor="#34d399" />
            <stop offset={zeroOffset} stopColor="#fb7185" />
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
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
        <Tooltip
          content={<NetTooltip hideValues={hideValues} />}
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="net"
          stroke={`url(#${strokeId})`}
          strokeWidth={2.5}
          fill={`url(#${fillId})`}
          dot={<NetDot />}
          activeDot={{ r: 5 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.4))" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
