import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ListFilter,
  Calendar,
  Search,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  useYoutubeAlerts,
  useMarkAllYoutubeVideosAsViewed,
} from "../../hooks/youtube/useYoutubeAlerts";
import { useSocket } from "../../context/SocketContext";
import LoadingSpinner from "../../components/LoadingSpinner";

const platformConfig = {
  label: "YouTube",
  color: "#FF0000",
};

const YouTubeAlerts = () => {
  const navigate = useNavigate();
  const { syncUnreadFromServer, stopAlertRing, removeToastForAlert } = useSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const { data, isLoading, isError } = useYoutubeAlerts({
    page: currentPage,
    limit: pageSize,
    sort,
  });
  const markAllViewedMutation = useMarkAllYoutubeVideosAsViewed();

  const videos = data?.videos || [];
  const pagination = data?.pagination || {};
  const totalVideos = pagination.total || 0;
  const totalPages = pagination.pages || 1;

  const handleMarkAllViewed = () => {
    markAllViewedMutation.mutate(undefined, {
      onSuccess: () => {
        syncUnreadFromServer();
      },
    });
  };

  const handleAlertClick = (alertId) => {
    navigate(`/alerts/youtube/${alertId}`);
  };

  // Client-side only: hides the video from view. Not persisted to the backend
  // since no dismiss endpoint currently exists.
  const handleDismiss = (alertId) => {
    removeToastForAlert(alertId);
    setDismissedIds((prev) => new Set(prev).add(alertId));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredAlerts = (videos || [])
    .filter((alert) => !dismissedIds.has(alert._id))
    .filter((alert) => {
      // Search filter
      const matchesSearch =
        (alert.videoTitle || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (alert.channelName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "newest")
        return (
          new Date(b.publishedAt || b.createdAt) -
          new Date(a.publishedAt || a.createdAt)
        );
      if (sort === "oldest")
        return (
          new Date(a.publishedAt || a.createdAt) -
          new Date(b.publishedAt || b.createdAt)
        );
      return 0;
    });

  // Separate alerts into viewed and unviewed
  const unviewedAlerts = filteredAlerts.filter((alert) => !alert.isRead);
  const viewedAlerts = filteredAlerts.filter((alert) => alert.isRead);

  const rangeStart = totalVideos === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalVideos);

  const renderVideoCard = (alert, viewed) => (
    <motion.div
      key={alert._id || alert.videoId}
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut", opacity: { duration: 0.15 } }}
      style={{ willChange: "transform, opacity" }}
      className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 hover:border-slate-300 hover:shadow-lg cursor-pointer group ${
        viewed ? "border-border" : "border-blue-400/40"
      }`}
      onClick={() => handleAlertClick(alert._id)}
    >
      {/* Thumbnail */}
      <div className="w-full sm:w-40 h-40 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
        {alert.thumbnail ? (
          <img
            src={alert.thumbnail}
            alt={alert.videoTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
            {alert.videoTitle}
          </h3>
          <span
            className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wide flex items-center gap-1 ${
              viewed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-600 text-white"
            }`}
          >
            {viewed ? <Eye size={10} /> : <EyeOff size={10} />}
            {viewed ? "Viewed" : "Unviewed"}
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1.5">
          {alert.channelName}
          {" · "}
          {new Date(alert.publishedAt || alert.createdAt).toLocaleString()}
        </p>

        {alert.videoDescription && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
            {alert.videoDescription}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAlertClick(alert._id);
            }}
            className="text-blue-600 text-xs font-semibold hover:underline"
          >
            View Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(alert._id);
            }}
            className="text-slate-500 text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      {/* Header row: Heading + stats (left) - Sort + Filter (right) */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span style={{ color: platformConfig.color }}>
              {platformConfig.label}
            </span>{" "}
            Alerts
          </h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <p className="text-sm text-slate-600">
              Total:{" "}
              <span className="font-semibold text-slate-800 tabular-nums">{totalVideos}</span>{" "}
              videos
            </p>
            <button
              onClick={handleMarkAllViewed}
              disabled={markAllViewedMutation.isPending}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <CheckCheck size={16} />
              {markAllViewedMutation.isPending ? "Marking..." : "Mark All Read"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <ListFilter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field pl-9 pr-8 py-2 text-sm appearance-none w-auto"
            >
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Calendar size={16} />
            Filter by date...
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-border rounded-2xl p-4 mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="text-center py-12 border-2 border-dashed border-red-200 rounded-2xl">
          <BellOff size={48} className="mx-auto text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-800">
            Error Loading Videos
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Could not fetch YouTube videos.
          </p>
        </div>
      ) : (
        <>
          {/* Unviewed Videos Section */}
          {unviewedAlerts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-amber-700 tabular-nums">
                  Unviewed Videos ({unviewedAlerts.length})
                </h2>
              </div>
              <motion.div className="space-y-4">
                {unviewedAlerts.map((alert) => renderVideoCard(alert, false))}
              </motion.div>
            </div>
          )}

          {/* Viewed Videos Section */}
          {viewedAlerts.length > 0 && (
            <div>
              {unviewedAlerts.length > 0 && (
                <div className="flex items-center gap-2 mb-3 mt-8">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-emerald-700 tabular-nums">
                    Viewed Videos ({viewedAlerts.length})
                  </h2>
                </div>
              )}
              <motion.div className="space-y-4">
                {viewedAlerts.map((alert) => renderVideoCard(alert, true))}
              </motion.div>
            </div>
          )}

          {/* No Results State */}
          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
              <BellOff size={48} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700">
                No Videos Found
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {searchTerm
                  ? `No YouTube videos match your search criteria.`
                  : `There are no YouTube alerts yet. Add channels to start monitoring.`}
              </p>
            </div>
          )}

          {/* Bottom Pagination */}
          {totalVideos > 0 && (
            <div className="flex items-center justify-between mt-8 px-4 py-4 bg-white border border-border rounded-2xl flex-wrap gap-3">
              <div className="text-sm text-slate-600 tabular-nums">
                Showing {rangeStart}-{rangeEnd} of {totalVideos} monitored activities
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoading}
                  className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Older
                </button>
                <span className="text-sm text-slate-600 tabular-nums px-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: platformConfig.color }}
                >
                  Newer
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default YouTubeAlerts;
