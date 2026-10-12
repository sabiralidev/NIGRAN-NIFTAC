import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Inbox } from "lucide-react";
import { buildTimeSeries } from "../../utils/timeRange";
import { formatCount } from "../../services/realtimeService";

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
};

const ChartTooltip = ({ active, payload, color }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5 shadow-lift sm:px-3.5 sm:py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-[11px]">
        {point?.fullLabel}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold tabular-nums text-slate-900 sm:text-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {formatCount(point?.count ?? 0)}
        <span className="text-[11px] font-medium text-slate-400 sm:text-xs">
          {point?.count === 1 ? "alert" : "alerts"}
        </span>
      </p>
    </div>
  );
};

/**
 * Real alerts-over-time graph. Buckets `events` (objects with createdAt / timestamp,
 * or raw date strings) across `range` and renders a time x-axis + count y-axis with a
 * grid and a hover tooltip showing the exact time/date and alert count.
 *
 * Responsive: on small screens the height passed in from the parent is
 * already reduced, and here we additionally shrink margins, axis width, tick
 * font size, and thin out x-axis labels so the chart doesn't feel cramped.
 */
const AlertsTimelineChart = ({ events = [], range, color = "#2563eb", height = 224 }) => {
  const isMobile = useIsMobile();
  const data = useMemo(() => buildTimeSeries(events, range), [events, range]);

  const hasData = data.some((d) => d.count > 0);
  // Show fewer x labels on mobile so they don't overlap.
  const baseInterval = data.length > 12 ? Math.ceil(data.length / 8) : 0;
  const tickInterval = isMobile ? Math.max(baseInterval, Math.ceil(data.length / 4) - 1) : baseInterval;

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={
            isMobile
              ? { top: 10, right: 4, left: -18, bottom: 0 }
              : { top: 12, right: 12, left: -8, bottom: 0 }
          }
        >
          <defs>
            <linearGradient id="alertsAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="55%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="alertsLineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,23,42,0.05)" vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: isMobile ? 9 : 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(15,23,42,0.06)" }}
            interval={tickInterval}
            minTickGap={isMobile ? 10 : 16}
            padding={{ left: isMobile ? 2 : 6, right: isMobile ? 2 : 6 }}
          />
          <YAxis
            allowDecimals={false}
            width={isMobile ? 26 : 38}
            tick={{ fontSize: isMobile ? 9 : 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCount(v)}
          />
          {hasData && (
            <Tooltip
              content={<ChartTooltip color={color} />}
              cursor={{ stroke: color, strokeOpacity: 0.25, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="count"
            stroke="url(#alertsLineStroke)"
            strokeWidth={2.5}
            fill="url(#alertsAreaFill)"
            dot={false}
            activeDot={{
              r: isMobile ? 4 : 5,
              strokeWidth: 2,
              stroke: "#ffffff",
              fill: color,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 px-5 py-4 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Inbox size={16} className="text-slate-400" />
            </div>
            <p className="text-center text-xs font-medium text-slate-400 sm:text-sm">
              No alert activity in the selected range
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsTimelineChart;