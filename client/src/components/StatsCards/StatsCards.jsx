import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";
import { formatCount } from "../../services/realtimeService";
import AlertsTimelineChart from "../dashboard/AlertsTimelineChart";
import { countInRange } from "../../utils/timeRange";
import { getPlatformTheme } from "../../utils/platformTheme";

// Track viewport so the chart can shrink its height on small screens without
// needing a resize observer per-card.
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

const MentionsCard = ({ mentions, loading, events = [], range, platform = "all" }) => {
  const [now, setNow] = useState(() => new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const theme = getPlatformTheme(platform);
  const chartColor = platform === "all" ? "#2563eb" : theme.accent;
  const inRange = range ? countInRange(events, range) : 0;
  const rangeLabel =
    range?.key === "custom"
      ? `${range.start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${range.end.toLocaleDateString([], { month: "short", day: "numeric" })}`
      : range?.label || "Selected range";

  return (
    <div className="stat-box relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-white to-slate-50/60 shadow-sm transition-shadow duration-200 hover:shadow-md sm:gap-5">
      {/* Ambient accent glow, tinted by the active platform's color */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: chartColor }}
      />

      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${chartColor}14` }}
            >
              <TrendingUp size={12} style={{ color: chartColor }} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Total Alerts
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-x-2.5 gap-y-1">
            <motion.span
              key={mentions}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-4xl lg:text-[2.75rem]"
            >
              {loading ? "-" : formatCount(mentions)}
            </motion.span>
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 sm:text-xs">
              <span className="tabular-nums" style={{ color: chartColor }}>
                {formatCount(inRange)}
              </span>
              in range
            </span>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold tabular-nums text-blue-700 sm:px-3 sm:text-[11px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          {now.toLocaleTimeString([], isMobile ? { hour: "2-digit", minute: "2-digit" } : undefined)}
        </span>
      </div>

      <div className="relative rounded-2xl border border-border/60 bg-white/60 p-2 sm:p-3">
        <AlertsTimelineChart
          events={events}
          range={range}
          color={chartColor}
          height={isMobile ? 160 : 224}
        />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
          <Activity size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">Alerts over time · {rangeLabel}</span>
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 font-medium"
          style={{ color: chartColor, background: `${chartColor}10` }}
        >
          {platform === "all" ? "All platforms" : `${theme.label} feed`}
        </span>
      </div>
    </div>
  );
};

const StatsCards = ({ stats, loading, platform = "all", events = [], range }) => {
  return (
    <div>
      <h2 className="section-header mb-2.5 sm:mb-3">Overview</h2>
      <MentionsCard
        mentions={stats?.mentions}
        loading={loading}
        events={events}
        range={range}
        platform={platform}
      />
    </div>
  );
};

export default StatsCards;