import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Gauge,
  Globe2,
  Hash,
  Layers3,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ActivityTimeline from "../ActivityTimeline";
import AvatarImage from "../AvatarImage";
import SourcesChart from "../Charts/SourcesChart";
import KeywordsPanel from "../KeywordsPanel/KeywordsPanel";
import { formatCount, PLATFORM_COLORS, PLATFORM_NAMES } from "../../services/realtimeService";
import {
  buildAnalyticsExport,
  DASHBOARD_RANGE_OPTIONS,
  deriveAlertAnalytics,
  deriveConnectionStats,
  deriveEngagementBreakdown,
  deriveKeywordInsights,
  deriveLiveFeed,
  derivePlatformDistribution,
  deriveTopAccounts,
  filterMentionsByRange,
  getInitialRangeForDateRange,
  normalizeMention,
} from "../../utils/dashboardAnalytics";
import { useKeywords } from "../../hooks/useDashboard";
import { useSocket } from "../../context/SocketContext";

const chartPalette = {
  alerts: "#60a5fa",
  positive: "#34d399",
  neutral: "#a78bfa",
  negative: "#f97316",
};

const cardClassName =
  "card h-full overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md";

const AnalyticsSkeleton = () => (
  <div className="grid gap-4 xl:grid-cols-12">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className={`animate-pulse ${cardClassName} ${
          index === 0 ? "xl:col-span-8" : "xl:col-span-4"
        }`}
      >
        <div className="h-72 bg-slate-100" />
      </div>
    ))}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[170px] rounded-xl border border-border bg-white px-3 py-2.5 text-xs shadow-2xl">
      {label ? <p className="mb-2 font-semibold text-slate-900">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
              {formatCount(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100">
        <Icon size={16} className="text-blue-700" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>
      </div>
    </div>
    {action}
  </div>
);

const MetricChip = ({ label, value, accent }) => (
  <div
    className="rounded-2xl border bg-slate-50/80 px-4 py-4 transition-colors duration-150 hover:bg-white"
    style={{ borderColor: accent ? `${accent}30` : "#e2e8f0" }}
  >
    <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">{label}</div>
    <div
      className="mt-2 text-2xl font-bold tracking-tight tabular-nums"
      style={{ color: accent || "#1f2937" }}
    >
      {value}
    </div>
  </div>
);

const LiveActivityCard = memo(({ items }) => (
  <div className={cardClassName}>
    <SectionHeader
      icon={Radio}
      title="Live Activity Stream"
      subtitle="Realtime events with source, timestamp, activity type, and derived signal severity."
      action={
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Live
        </div>
      }
    />
    <div className="max-h-[520px] overflow-y-auto pr-1">
      <ActivityTimeline alerts={items} maxItems={12} />
    </div>
  </div>
));

const DistributionCard = memo(({ data, title, subtitle }) => (
  <div className={cardClassName}>
    <SectionHeader icon={Globe2} title={title} subtitle={subtitle} />
    {data.length === 0 ? (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 text-sm text-slate-500">
        No distribution data available yet
      </div>
    ) : (
      <>
        <div className="h-[280px] rounded-2xl border border-border bg-slate-50 p-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={74}
                outerRadius={106}
                startAngle={90}
                endAngle={-270}
                paddingAngle={4}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend
                wrapperStyle={{ paddingTop: 14, justifyContent: 'center' }}
                iconSize={10}
                iconType="circle"
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {data.slice(0, 6).map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-border bg-slate-50 px-4 py-3.5 transition-colors duration-150 hover:border-blue-200 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-sm font-semibold text-slate-900">{item.name}</span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {formatCount(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
));

const AlertsStatusCard = memo(({ severityData, statusData, summary }) => (
  <div className={cardClassName}>
    <SectionHeader
      icon={ShieldAlert}
      title="Alerts Analytics"
      subtitle="Derived severity bands and live operational state for active monitoring."
    />

    <div className="grid gap-3 sm:grid-cols-4">
      <MetricChip label="Total Alerts" value={formatCount(summary.total)} accent="#1e40af" />
      <MetricChip label="Pending" value={formatCount(summary.pending)} accent="#3b82f6" />
      <MetricChip label="Resolved" value={formatCount(summary.resolved)} accent="#059669" />
      <MetricChip label="Ignored" value={formatCount(summary.ignored)} accent="#64748b" />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="h-full rounded-2xl border border-border bg-slate-50 p-4">
        <KeywordsPanel className="h-full bg-transparent border-0 p-0 shadow-none rounded-none" />
      </div>
      <div className="h-[260px] rounded-2xl border border-border bg-slate-50 p-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart layout="vertical" data={statusData} margin={{ top: 12, right: 12, left: 12, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="value" name="Count" radius={[0, 14, 14, 0]} barSize={16}>
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
));

const TopAccountsCard = memo(({ items }) => (
  <div className={cardClassName}>
    <SectionHeader
      icon={Users}
      title="Top Active Accounts"
      subtitle="Accounts generating the highest monitoring volume with live unread alert tracking."
    />

    {items.length === 0 ? (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50 text-sm text-slate-500">
        No account activity available yet
      </div>
    ) : (
      <div className="space-y-2.5">
        {items.slice(0, 5).map((item, index) => {
          const platformColor = PLATFORM_COLORS[item.platform] || "#64748b";
          const hasUnread = (item.unreadAlerts || 0) > 0;

          return (
            <div
              key={`${item.platform}-${item.username || item.name}`}
              className="rounded-2xl border border-border bg-slate-50 px-4 py-3 transition-colors duration-150 hover:border-blue-200 hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-slate-700">
                  {index + 1}
                </div>
                <AvatarImage
                  src={item.avatar}
                  alt={item.name}
                  size="sm"
                  fallbackLabel={item.name?.slice(0, 2)}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">@{item.username || item.name}</span>
                    <span
                      className="shrink-0 rounded-full border px-2 py-0.5"
                      style={{
                        color: platformColor,
                        borderColor: `${platformColor}40`,
                        backgroundColor: `${platformColor}14`,
                      }}
                    >
                      {PLATFORM_NAMES[item.platform] || item.platform}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatCount(item.alerts)} alerts
                  </div>
                  <div
                    className={`mt-1 text-xs tabular-nums ${hasUnread ? "font-medium text-red-700" : "text-slate-500"}`}
                  >
                    {formatCount(item.unreadAlerts || 0)} unread
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
));

const HealthCard = memo(({ health, liveCount, range, sources, loading }) => (
  <div className={cardClassName}>
    <SectionHeader
      icon={Gauge}
      title="Monitoring Health"
      subtitle="Realtime connection health, refresh cadence, and active stream coverage."
    />

    <div className="grid gap-3 sm:grid-cols-4">
      <MetricChip label="Online Sources" value={`${health.online}/${health.total}`} accent="#059669" />
      <MetricChip label="Availability" value={`${health.availability}%`} accent="#1e40af" />
      <MetricChip label="Live Events" value={formatCount(liveCount)} accent="#ea580c" />
      <MetricChip
        label="Refresh Cadence"
        value={range === "1h" || range === "today" ? "Realtime" : "Auto"}
        accent="#7c3aed"
      />
    </div>

    <div className="mt-5">
      <SourcesChart sources={sources} loading={loading} healthItems={health.items} />
    </div>
  </div>
));

const EnterpriseAnalyticsBoard = ({
  platform = "all",
  dateRange = "7",
  stats = {},
  timeline = [],
  mentions = [],
  allMentions = [],
  sources = [],
  accounts = [],
  totalAlertsCount,
  pendingAlertsCount,
  loading = false,
}) => {
  const { recentAlerts, connected, activeAlerts } = useSocket();
  const { data: keywordPayload } = useKeywords();
  const [range, setRange] = useState(() => getInitialRangeForDateRange(dateRange));

  const normalizedMentions = useMemo(() => {
    const baseItems = (allMentions.length > 0 ? allMentions : mentions).map((item) =>
      normalizeMention(item, platform),
    );

    return baseItems
      .filter((item) => platform === "all" || item.platform === platform)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allMentions, mentions, platform]);

  const normalizedLiveAlerts = useMemo(
    () =>
      recentAlerts
        .map((item) => normalizeMention(item, item.platform || platform))
        .filter((item) => platform === "all" || item.platform === platform),
    [platform, recentAlerts],
  );

  const filteredMentions = useMemo(
    () => filterMentionsByRange(normalizedMentions, range),
    [normalizedMentions, range],
  );

  const distribution = useMemo(
    () => derivePlatformDistribution(filteredMentions, platform === "all" ? sources : []),
    [filteredMentions, platform, sources],
  );

  const alertAnalytics = useMemo(
    () =>
      deriveAlertAnalytics(filteredMentions, normalizedLiveAlerts, {
        total: totalAlertsCount,
        pending: pendingAlertsCount,
      }),
    [filteredMentions, normalizedLiveAlerts, pendingAlertsCount, totalAlertsCount],
  );

  const engagement = useMemo(
    () => deriveEngagementBreakdown(filteredMentions),
    [filteredMentions],
  );

  const keywordInsights = useMemo(
    () => deriveKeywordInsights(filteredMentions, keywordPayload || []),
    [filteredMentions, keywordPayload],
  );

  const unreadIdSet = useMemo(
    () => new Set(activeAlerts.map((alert) => alert._id).filter(Boolean)),
    [activeAlerts],
  );

  const mentionsForTopAccounts = useMemo(() => {
    const liveStateById = new Map(
      recentAlerts
        .filter((alert) => alert._id)
        .map((alert) => [
          alert._id,
          {
            isViewed: alert.isViewed,
            isRead: alert.isRead,
            status: alert.status,
          },
        ]),
    );

    const merged = [...filteredMentions, ...normalizedLiveAlerts].map((item) => {
      const liveState = liveStateById.get(item._id);
      return liveState ? { ...item, ...liveState } : item;
    });

    const seen = new Set();
    return merged.filter((item) => {
      const key = `${item.platform || "unknown"}:${item._id || item.postUrl || item.authorUsername}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredMentions, normalizedLiveAlerts, recentAlerts]);

  const topAccounts = useMemo(
    () => deriveTopAccounts(mentionsForTopAccounts, accounts, unreadIdSet),
    [mentionsForTopAccounts, accounts, unreadIdSet],
  );
  const liveFeed = useMemo(
    () => deriveLiveFeed(normalizedMentions, normalizedLiveAlerts, platform),
    [normalizedMentions, normalizedLiveAlerts, platform],
  );
  const health = useMemo(
    () => deriveConnectionStats(connected, platform),
    [connected, platform],
  );

  const handleExport = () => {
    const snapshot = buildAnalyticsExport({
      platform,
      range,
      platformDistribution: distribution,
      alerts: alertAnalytics.summary,
      engagement: {
        ...engagement.totals,
        rate: engagement.engagementRate,
      },
      keywords: keywordInsights,
      topAccounts,
      health,
    });

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nigran-${platform}-analytics-${range}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const isBusy = loading && normalizedMentions.length === 0;

  return (
    <section className="space-y-4">
      <div className="card relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-white to-slate-50 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "#2563eb" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100">
              <Activity size={16} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Enterprise Analytics</h2>
              <p className="mt-1 text-sm text-slate-500">
                Real-time monitoring, intelligence summaries, and operational insight layered on top of the existing dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  range === option.id
                    ? "border-blue-200 bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border-border bg-white text-slate-600 hover:border-blue-200 hover:text-slate-900 hover:bg-blue-50/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
              <RefreshCw size={12} className="animate-spin [animation-duration:3s]" />
              Auto-refresh active
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary px-3 py-1.5 text-xs transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
      </div>

      {isBusy ? (
        <AnalyticsSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-4 xl:grid-cols-12"
        >
          <div className="xl:col-span-8">
            <LiveActivityCard items={liveFeed} />
          </div>

          <div className="xl:col-span-4">
            <DistributionCard
              data={distribution}
              title={platform === "all" ? "Platform Distribution" : "Source Performance"}
              subtitle={
                platform === "all"
                  ? "Cross-platform contribution and source share across monitored activity."
                  : `Contribution mix for ${PLATFORM_NAMES[platform] || platform} activity sources.`
              }
            />
          </div>
          <div className="xl:col-span-4">
            <TopAccountsCard items={topAccounts} />
          </div>

          <div className="xl:col-span-8">
            <AlertsStatusCard
              severityData={alertAnalytics.severityData}
              statusData={alertAnalytics.statusData}
              summary={alertAnalytics.summary}
            />
          </div>
          <div className="xl:col-span-12">
            <HealthCard health={health} liveCount={liveFeed.length} range={range} sources={sources} loading={loading} />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default memo(EnterpriseAnalyticsBoard);