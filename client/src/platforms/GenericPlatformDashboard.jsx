import { Suspense, lazy, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import StatsCards from "../components/StatsCards/StatsCards";
import { rangeToDays } from "../utils/timeRange";
import RecentMentions from "../components/RecentMentions/RecentMentions";
import PlatformAccounts from "../components/PlatformAccounts/PlatformAccounts";
import {
  useDashboardStats,
  useDashboardTimeline,
  usePlatformAccounts,
  useDashboardMentions,
} from "../hooks/useDashboard";
import {
  useFacebookStats,
  useFacebookAccounts,
  useFacebookAlerts,
  useFacebookTimeline,
} from "../hooks/facebook/useFacebookDashboard";
import {
  useYoutubeStats,
  useYoutubeAccounts,
  useYoutubeAlerts,
  useYoutubeTimeline,
} from "../hooks/youtube/useYoutubeDashboard";
import {
  useInstagramStats,
  useInstagramAccounts,
  useInstagramAlerts,
  useInstagramTimeline,
} from "../hooks/instagram/useInstagramDashboard";
import {
  useTikTokStats,
  useTikTokAccounts,
  useTikTokAlerts,
  useTikTokTimeline,
} from "../hooks/tiktok/useTikTokDashboard";
import { useSocket } from "../context/SocketContext";
import { PLATFORM_NAMES } from "../services/realtimeService";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, Users } from "lucide-react";

const EnterpriseAnalyticsBoard = lazy(
  () => import("../components/dashboard/EnterpriseAnalyticsBoard"),
);

const AnalyticsFallback = () => (
  <div className="card h-[280px] animate-pulse rounded-2xl bg-slate-100 sm:h-[320px]" />
);

const countUnviewedItems = (items = []) =>
  items.filter((item) => {
    const status = String(item?.status || "").toLowerCase();
    return !(item?.isViewed || item?.isRead || status === "viewed" || status === "resolved");
  }).length;

const PLATFORM_TABS = [
  { key: "youtube", label: "YouTube", color: "#FF0000" },
  { key: "facebook", label: "Facebook", color: "#1877F2" },
  { key: "twitter", label: "Twitter", color: "#1DA1F2" },
  { key: "instagram", label: "Instagram", color: "#E1306C" },
  { key: "tiktok", label: "TikTok", color: "#000000" },
];

const GenericPlatformDashboard = ({ platform, range }) => {
  const dateRange = String(range ? rangeToDays(range) : 7);
  // Use Facebook-specific hooks if platform is "facebook"
  const isFacebook = platform?.toLowerCase() === "facebook";
  const isYoutube = platform?.toLowerCase() === "youtube";
  const isInstagram = platform?.toLowerCase() === "instagram";
  const isTikTok = platform?.toLowerCase() === "tiktok";
  const queryClient = useQueryClient();
  const { onNewAlert } = useSocket();

  // Facebook hooks
  const facebookStats = useFacebookStats();
  const facebookAccounts = useFacebookAccounts();
  const facebookAlerts = useFacebookAlerts(10);
  const facebookTimeline = useFacebookTimeline(7);

  // YouTube hooks
  const youtubeStats = useYoutubeStats(parseInt(dateRange) || 7);
  const youtubeAccounts = useYoutubeAccounts();
  const youtubeAlerts = useYoutubeAlerts(1000);
  const youtubeTimeline = useYoutubeTimeline(parseInt(dateRange) || 7);

  // Instagram hooks
  const instagramStats = useInstagramStats(parseInt(dateRange) || 7);
  const instagramAccounts = useInstagramAccounts();
  const instagramAlerts = useInstagramAlerts(1000);
  const instagramTimeline = useInstagramTimeline(parseInt(dateRange) || 7);

  // TikTok hooks
  const tiktokStats = useTikTokStats(parseInt(dateRange) || 7);
  const tiktokAccounts = useTikTokAccounts();
  const tiktokAlerts = useTikTokAlerts(1000);
  const tiktokTimeline = useTikTokTimeline(parseInt(dateRange) || 7);

  // Generic hooks (for other platforms)
  const genericStats = useDashboardStats(platform, dateRange);
  const genericTimeline = useDashboardTimeline(platform, dateRange);
  const genericAccounts = usePlatformAccounts(platform);
  const genericMentions = useDashboardMentions(platform, 1000);

  // Real-time updates: Listen for new alerts and invalidate queries
  useEffect(() => {
    if (!isFacebook && !isYoutube && !isInstagram && !isTikTok) return;

    const unsub = onNewAlert(() => {
      if (isFacebook) {
        queryClient.invalidateQueries({ queryKey: ["facebookStats"] });
        queryClient.invalidateQueries({ queryKey: ["facebookAlerts"] });
        queryClient.invalidateQueries({ queryKey: ["facebookAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["facebookTimeline"] });
      } else if (isYoutube) {
        queryClient.invalidateQueries({ queryKey: ["youtubeStats"] });
        queryClient.invalidateQueries({ queryKey: ["youtubeAlerts"] });
        queryClient.invalidateQueries({ queryKey: ["youtubeAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["youtubeTimeline"] });
      } else if (isInstagram) {
        queryClient.invalidateQueries({ queryKey: ["instagramStats"] });
        queryClient.invalidateQueries({ queryKey: ["instagramAlerts"] });
        queryClient.invalidateQueries({ queryKey: ["instagramAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["instagramTimeline"] });
      } else if (isTikTok) {
        queryClient.invalidateQueries({ queryKey: ["tiktokStats"] });
        queryClient.invalidateQueries({ queryKey: ["tiktokDashboardAlerts"] });
        queryClient.invalidateQueries({ queryKey: ["tiktokAccounts"] });
        queryClient.invalidateQueries({ queryKey: ["tiktokTimeline"] });
      }
    });

    return unsub;
  }, [isFacebook, isInstagram, isYoutube, isTikTok, onNewAlert, queryClient]);

  // Select data based on platform
  let statsLoading, statsData, timelineData, accountsData, accountsLoading;
  let fullMentions = [];
  let pendingAlertsCount = 0;

  if (isFacebook) {
    statsLoading = facebookStats.isLoading;
    accountsLoading = facebookAccounts.isLoading;

    const alerts = facebookStats.data?.alerts || [];
    const totalLikes = facebookStats.data?.totalLikes || 0;
    const totalShares = facebookStats.data?.totalShares || 0;
    const totalComments = facebookStats.data?.totalComments || 0;
    const totalEngagement = facebookStats.data?.totalEngagement || (totalLikes + totalShares + totalComments);
    const totalAlerts = facebookStats.data?.totalAlerts || 0;
    const trend = facebookStats.data?.trend || "0%";

    const sourceMap = {};
    alerts.forEach(alert => {
      const source = alert.source || alert.authorUsername || 'Unknown';
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    });

    const sources = Object.entries(sourceMap).map(([name, count]) => ({
      name,
      value: count,
      color: '#1877F2',
    }));

    statsData = {
      stats: {
        mentions: totalAlerts,
        mentionsTrend: trend,
        engagement: totalEngagement,
        engagementTrend: totalEngagement > 0 ? "+8%" : "0%",
        likes: totalLikes,
        shares: totalShares,
        comments: totalComments,
        recentMentions: facebookAlerts.data?.recentAlerts || [],
        sources: sources,
        sentiment: {
          positive: 45,
          negative: 25,
          neutral: 30,
        },
      },
    };
    timelineData = {
      timeline: facebookTimeline.data?.timeline || [],
    };
    accountsData = {
      accounts: facebookAccounts.data?.accounts || [],
    };
    fullMentions = facebookAlerts.data?.alerts || [];
    pendingAlertsCount = countUnviewedItems(fullMentions);
  } else if (isYoutube) {
    statsLoading = youtubeStats.isLoading;
    accountsLoading = youtubeAccounts.isLoading;

    const stats = youtubeStats.data?.stats || {};
    const totalVideos = stats.mentions || 0;
    const videosTrend = stats.mentionsTrend || "0%";
    const engagement = stats.engagement || 0;
    const sentiment = stats.sentiment || { positive: 45, negative: 12, neutral: 43 };
    const recentMentions = youtubeAlerts.data?.recentAlerts || stats.recentMentions || [];
    const fullYoutubeAlerts = youtubeAlerts.data?.alerts || [];
    const sources = stats.sources || [{ name: 'YouTube', value: totalVideos, color: '#FF0000' }];

    statsData = {
      stats: {
        mentions: totalVideos,
        mentionsTrend: videosTrend,
        engagement: engagement,
        engagementTrend: engagement > 0 ? "+12%" : "0%",
        recentMentions: recentMentions,
        sources: sources,
        sentiment: sentiment,
      },
    };
    timelineData = {
      timeline: youtubeTimeline.data?.timeline || [],
    };
    accountsData = {
      accounts: youtubeAccounts.data?.accounts || [],
    };
    fullMentions = fullYoutubeAlerts;
    pendingAlertsCount = countUnviewedItems(fullMentions);
  } else if (isInstagram) {
    statsLoading = instagramStats.isLoading;
    accountsLoading = instagramAccounts.isLoading;

    const stats = instagramStats.data?.stats || {};
    const mentions = instagramAlerts.data?.recentAlerts || stats.recentMentions || [];
    const fullInstagramAlerts = instagramAlerts.data?.alerts || mentions;
    const sources = stats.sources || [{ name: "Instagram", value: 1, color: "#E1306C" }];

    statsData = {
      stats: {
        mentions: stats.mentions || 0,
        mentionsTrend: stats.mentionsTrend || "0%",
        engagement: stats.engagement || 0,
        engagementTrend: (stats.engagement || 0) > 0 ? "+10%" : "0%",
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        recentMentions: mentions,
        sources,
        sentiment: stats.sentiment || {
          positive: 42,
          negative: 20,
          neutral: 38,
        },
      },
    };
    timelineData = {
      timeline: instagramTimeline.data?.timeline || [],
    };
    accountsData = {
      accounts: instagramAccounts.data?.accounts || [],
    };
    fullMentions = fullInstagramAlerts;
    pendingAlertsCount = countUnviewedItems(fullMentions);
  } else if (isTikTok) {
    statsLoading = tiktokStats.isLoading;
    accountsLoading = tiktokAccounts.isLoading;

    const stats = tiktokStats.data?.stats || {};
    const mentions = tiktokAlerts.data?.recentAlerts || stats.recentMentions || [];
    const fullTikTokAlerts = tiktokAlerts.data?.alerts || mentions;
    const sources = stats.sources || [{ name: "TikTok", value: 1, color: "#000000" }];

    statsData = {
      stats: {
        mentions: stats.mentions || 0,
        mentionsTrend: stats.mentionsTrend || "0%",
        engagement: stats.engagement || 0,
        engagementTrend: (stats.engagement || 0) > 0 ? "+10%" : "0%",
        likes: stats.likes || 0,
        shares: stats.shares || 0,
        comments: stats.comments || 0,
        recentMentions: mentions,
        sources,
        sentiment: stats.sentiment || { positive: 42, negative: 20, neutral: 38 },
      },
    };

    timelineData = {
      timeline: tiktokTimeline.data?.timeline || [],
    };
    accountsData = {
      accounts: tiktokAccounts.data?.accounts || [],
    };
    fullMentions = fullTikTokAlerts;
    pendingAlertsCount = countUnviewedItems(fullMentions);
  } else {
    statsLoading = genericStats.isLoading;
    accountsLoading = genericAccounts.isLoading;
    statsData = genericStats.data;
    timelineData = genericTimeline.data;
    accountsData = genericAccounts.data;
    fullMentions = genericMentions.data?.mentions || statsData?.stats?.recentMentions || [];
    pendingAlertsCount = countUnviewedItems(fullMentions);
  }

  const stats = statsData?.stats || {};
  const timeline = timelineData?.timeline || [];
  const accounts = accountsData?.accounts || [];
  const mentions = stats.recentMentions || [];
  const analyticsMentions = fullMentions.length > 0 ? fullMentions : mentions;
  const sources = stats.sources || [];
  const platformName = PLATFORM_NAMES[platform] || platform;

  return (
    <motion.div
      key={platform}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5"
    >
      {/* Integration notice banner */}
      {!isFacebook && !isYoutube && !isInstagram && !isTikTok && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-xs shadow-sm sm:gap-3 sm:px-5 sm:py-3.5">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <span className="font-semibold text-amber-700">{platformName} Integration</span>
          <span className="hidden text-amber-300 sm:inline">-</span>
          <span className="text-amber-600/90">
            API integration pending. Showing demo data. Configure {platformName}{" "}
            API credentials to enable real-time monitoring.
          </span>
        </div>
      )}

      {/* Stats overview */}
      <StatsCards
        stats={stats}
        loading={statsLoading}
        events={analyticsMentions}
        range={range}
        platform={platform}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0">
          <div className="stat-box h-full rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <FileText size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Recent Posts</h3>
            </div>
            <div className="p-2 sm:p-3">
              <RecentMentions mentions={mentions} loading={statsLoading} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="stat-box h-full rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Accounts</h3>
              </div>
            </div>

            <div className="px-4 pt-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {PLATFORM_TABS.map(({ key, label, color }) => {
                  const active = key === platform;
                  return (
                    <span
                      key={key}
                      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                      style={
                        active
                          ? {
                              color,
                              background: `${color}14`,
                              border: `1px solid ${color}40`,
                            }
                          : {
                              color: "#64748b",
                              background: "#F8FAFC",
                              border: "1px solid #E6EBF3",
                            }
                      }
                    >
                      {label}
                    </span>
                  );
                })}
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
      </div>

      <Suspense fallback={<AnalyticsFallback />}>
        <EnterpriseAnalyticsBoard
          platform={platform}
          dateRange={dateRange}
          stats={stats}
          timeline={timeline}
          mentions={mentions}
          allMentions={analyticsMentions}
          sources={sources}
          accounts={accounts}
          totalAlertsCount={stats.mentions || analyticsMentions.length}
          pendingAlertsCount={pendingAlertsCount}
          loading={statsLoading || accountsLoading}
        />
      </Suspense>
    </motion.div>
  );
};

export default GenericPlatformDashboard;