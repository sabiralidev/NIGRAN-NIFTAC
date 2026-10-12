import { Suspense, lazy, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import StatsCards from "../../components/StatsCards/StatsCards";
import RecentMentions from "../../components/RecentMentions/RecentMentions";
import MediaFeed from "../../components/MediaFeed/MediaFeed";
import PlatformAccounts from "../../components/PlatformAccounts/PlatformAccounts";
import {
  useDashboardStats,
  useDashboardTimeline,
  usePlatformAccounts,
  useDashboardMentions,
} from "../../hooks/useDashboard";
import { rangeToDays } from "../../utils/timeRange";
import { useUnreadCount } from "../../hooks/useAlerts";
import { useSocket } from "../../context/SocketContext";

const EnterpriseAnalyticsBoard = lazy(
  () => import("../../components/dashboard/EnterpriseAnalyticsBoard"),
);

const AnalyticsFallback = () => (
  <div className="card h-[280px] animate-pulse bg-slate-100 sm:h-[320px]" />
);

const TwitterDashboard = ({ range }) => {
  const dateRange = String(range ? rangeToDays(range) : 7);
  const platform = "twitter";
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(
    platform,
    dateRange,
  );
  const { data: timelineData } = useDashboardTimeline(platform, dateRange);
  const { data: accountsData, isLoading: accountsLoading } =
    usePlatformAccounts(platform);
  const { data: mentionsData, isLoading: mentionsLoading } =
    useDashboardMentions(platform, 10);
  const { data: allMentionsData, isLoading: allMentionsLoading } =
    useDashboardMentions(platform, 1000);
  const { data: unreadCountData } = useUnreadCount();
  const { onNewAlert } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = onNewAlert(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats", platform] });
      queryClient.invalidateQueries({
        queryKey: ["dashboardMentions", platform],
      });
      queryClient.invalidateQueries({
        queryKey: ["platformAccounts", platform],
      });
    });
    return unsub;
  }, [onNewAlert, queryClient]);

  const stats = statsData?.stats || {};
  const timeline = timelineData?.timeline || [];
  const accounts = accountsData?.accounts || [];
  const mentions = mentionsData?.mentions || stats.recentMentions || [];
  const allMentions = allMentionsData?.mentions || mentions;
  const sources = stats.sources || [];

  const mediaFeed = useMemo(() => {
    return (stats.mediaFeed || []).map((item) => ({
      ...item,
      views: item.views
        ? formatDistanceToNow(new Date(item.views), { addSuffix: true })
        : "",
    }));
  }, [stats.mediaFeed]);

  return (
    <motion.div
      key="twitter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Stats overview */}
      <StatsCards
        stats={stats}
        loading={statsLoading}
        events={allMentions}
        range={range}
        platform={platform}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        {/* Recent Mentions - left */}
        <div className="min-w-0 lg:col-span-8">
          <div className="stat-box h-full">
            <h3 className="section-header">Recent Posts</h3>
            <RecentMentions
              mentions={mentions}
              loading={statsLoading || mentionsLoading}
            />
          </div>
        </div>

        {/* Platform accounts - right */}
        <div className="min-w-0 lg:col-span-4">
          <div className="stat-box h-full">
            {/* Platform sub-tabs */}
            <div
              className="mb-3 flex gap-0 overflow-x-auto scrollbar-hide"
              style={{ borderBottom: "1px solid #E6EBF3", paddingBottom: 6 }}
            >
              {["Youtube", "Facebook", "Twitter", "TikTok"].map((p) => (
                <span
                  key={p}
                  className="shrink-0 whitespace-nowrap px-3 py-1 text-xs cursor-pointer"
                  style={
                    p === "Twitter"
                      ? {
                          color: "#f59e0b",
                          borderBottom: "2px solid #f59e0b",
                          fontWeight: 600,
                        }
                      : { color: "#64748b" }
                  }
                >
                  {p}
                </span>
              ))}
            </div>
            <PlatformAccounts
              accounts={accounts}
              loading={accountsLoading}
              platform={platform}
              showManageButton={true}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<AnalyticsFallback />}>
        <EnterpriseAnalyticsBoard
          platform={platform}
          dateRange={dateRange}
          stats={stats}
          timeline={timeline}
          mentions={mentions}
          allMentions={allMentions}
          sources={sources}
          accounts={accounts}
          totalAlertsCount={stats.mentions || allMentions.length}
          pendingAlertsCount={unreadCountData?.count || 0}
          loading={statsLoading || mentionsLoading || allMentionsLoading || accountsLoading}
        />
      </Suspense>
    </motion.div>
  );
};

export default TwitterDashboard;