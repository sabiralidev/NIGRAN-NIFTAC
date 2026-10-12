import { useQueryClient } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { motion } from "framer-motion";
import StatsCards from "../../components/StatsCards/StatsCards";
import RecentMentions from "../../components/RecentMentions/RecentMentions";
import PlatformAccounts from "../../components/PlatformAccounts/PlatformAccounts";
import { useCombinedPlatformStats } from "../../hooks/useDashboard";
import { useUnreadCountAll } from "../../hooks/useUnreadCountAll";
import { useSocket } from "../../context/SocketContext";
import { rangeToDays } from "../../utils/timeRange";

const EnterpriseAnalyticsBoard = lazy(
  () => import("../../components/dashboard/EnterpriseAnalyticsBoard"),
);

const AnalyticsFallback = () => (
  <div className="card h-[280px] animate-pulse bg-slate-100 sm:h-[320px]" />
);

const AllPlatformsDashboard = ({ range }) => {
  const days = range ? rangeToDays(range) : 7;
  const { data: combinedData, isLoading: combinedLoading } = useCombinedPlatformStats(days);
  const { data: unreadCounts } = useUnreadCountAll();
  const { onNewAlert } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = onNewAlert(() => {
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });
    });
    return unsub;
  }, [onNewAlert, queryClient]);

  // Pagination logic
  const allAccounts = combinedData?.accounts || [];

  const stats = {
    mentions: combinedData?.mentions || 0,
    engagement: combinedData?.engagement || 0,
    recentMentions: combinedData?.recentMentions || [],
    sources: combinedData?.sources || [],
    sentiment: combinedData?.twitterData?.sentiment || { positive: 0, negative: 0, neutral: 0 },
  };

  const mentions = stats.recentMentions || [];
  const sources = stats.sources || [];
  const totalAlertsCount = combinedData?.mentions || 0;
  const pendingAlertsCount = unreadCounts?.count || 0;

  return (
    <motion.div
      key="all"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-3 sm:space-y-4"
    >
      <StatsCards
        stats={stats}
        loading={combinedLoading}
        events={combinedData?.allMentions || combinedData?.recentMentions || []}
        range={range}
        platform="all"
      />

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0">
          <div className="stat-box h-full">
            <h3 className="section-header">Recent Posts</h3>
            <RecentMentions mentions={mentions} loading={combinedLoading} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="stat-box flex h-full flex-col">
            <h3 className="section-header mb-3">All Accounts</h3>
            <div className="flex-1 overflow-y-auto">
              <PlatformAccounts
                accounts={allAccounts}
                loading={combinedLoading}
                platform="all"
                showManageButton={false}
              />
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<AnalyticsFallback />}>
        <EnterpriseAnalyticsBoard
          platform="all"
          dateRange={days}
          stats={stats}
          timeline={[]}
          mentions={mentions}
          allMentions={combinedData?.allMentions || combinedData?.recentMentions || []}
          sources={sources}
          accounts={allAccounts}
          totalAlertsCount={totalAlertsCount}
          pendingAlertsCount={pendingAlertsCount}
          loading={combinedLoading}
        />
      </Suspense>
    </motion.div>
  );
};

export default AllPlatformsDashboard;

