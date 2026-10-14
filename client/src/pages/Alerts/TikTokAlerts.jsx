import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ListFilter,
  Calendar,
  Search,
  BellOff,
  CheckCheck,
  Image,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertCard from "../../components/AlertCard";
import { useSocket } from "../../context/SocketContext";
import {
  useTikTokAlerts,
  useMarkAllTikTokAlertsRead,
} from "../../hooks/tiktok/useTikTokAlerts";
import LoadingSpinner from "../../components/LoadingSpinner";

const platformConfig = {
  label: "TikTok",
  color: "#000000",
}

const postTypeConfig = {
  ALL: { label: "All", icon: SlidersHorizontal, color: "gray" },
  VIDEO: { label: "Video", icon: Video, color: "orange" },
  CAROUSEL: { label: "Carousel", icon: Image, color: "purple" },
};

const TikTokAlerts = () => {
  const navigate = useNavigate();
  const { syncUnreadFromServer, stopAlertRing, removeToastForAlert } = useSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [postTypeFilter, setPostTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const { data, isLoading, isError } = useTikTokAlerts({
    page: currentPage,
    limit: pageSize,
    sort,
  });
  const markAllReadMutation = useMarkAllTikTokAlertsRead();

  const alerts = data?.alerts || [];
  const pagination = data?.pagination || {};
  const totalAlerts = pagination.total || 0;
  const totalPages = pagination.pages || 1;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        syncUnreadFromServer();
      },
    });
  };

  const handleAlertClick = (alertId) => {
    navigate(`/alerts/tiktok/${alertId}`);
  };

  // Client-side only: hides the alert from view. Not persisted to the backend
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

  const filteredAlerts = (alerts || [])
    .filter((alert) => !dismissedIds.has(alert._id))
    .filter((alert) => {
      const matchesSearch = (alert.content || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchesType = true;
      if (postTypeFilter !== "ALL") {
        const detectedType = String(alert.postType || "VIDEO").toUpperCase();
        matchesType = detectedType === postTypeFilter;
      }

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sort === "newest")
        return (
          new Date(b.timestamp || b.createdAt) -
          new Date(a.timestamp || a.createdAt)
        );
      if (sort === "oldest")
        return (
          new Date(a.timestamp || a.createdAt) -
          new Date(b.timestamp || b.createdAt)
        );
      return 0;
    });

  const unviewedAlerts = filteredAlerts.filter((alert) => !alert.isRead);
  const viewedAlerts = filteredAlerts.filter((alert) => alert.isRead);

  const rangeStart = totalAlerts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalAlerts);

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
            <p className="text-sm text-slate-500">
              Total:{" "}
              <span className="font-semibold text-slate-700 tabular-nums">{totalAlerts}</span>{" "}
              alerts
            </p>
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <CheckCheck size={16} />
              {markAllReadMutation.isPending ? "Marking..." : "Mark All Read"}
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

      {/* Search + Post Type filters */}
      <div className="bg-white border border-border rounded-2xl p-4 mb-6">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
          <span className="text-xs text-slate-600 font-semibold mr-2">
            Post Type:
          </span>
          {Object.entries(postTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            const isActive = postTypeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setPostTypeFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium border ${
                  isActive
                    ? `bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`
                    : "bg-slate-100 text-slate-700 border-border hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <Icon size={14} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="text-center py-12 border-2 border-dashed border-red-200 rounded-2xl">
          <BellOff size={48} className="mx-auto text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-700">
            Error Loading Alerts
          </h3>
          <p className="mt-1 text-sm text-red-500">
            Try refreshing the page or contact support.
          </p>
        </div>
      ) : (
        <>
          {unviewedAlerts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-amber-700 tabular-nums">
                  Unviewed Posts ({unviewedAlerts.length})
                </h2>
              </div>
              <motion.div className="space-y-4">
                {unviewedAlerts.map((alert) => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    platform="tiktok"
                    onView={() => handleAlertClick(alert._id)}
                    onDismiss={handleDismiss}
                    variant="compact"
                  />
                ))}
              </motion.div>
            </div>
          )}

          {viewedAlerts.length > 0 && (
            <div>
              {unviewedAlerts.length > 0 && (
                <div className="flex items-center gap-2 mb-3 mt-8">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-emerald-700 tabular-nums">
                    Viewed Posts ({viewedAlerts.length})
                  </h2>
                </div>
              )}
              <motion.div className="space-y-4">
                {viewedAlerts.map((alert) => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    platform="tiktok"
                    onView={() => handleAlertClick(alert._id)}
                    onDismiss={handleDismiss}
                    variant="compact"
                  />
                ))}
              </motion.div>
            </div>
          )}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
              <BellOff size={48} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700">
                No Alerts Found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                There are no {platformConfig.label} alerts matching your
                criteria.
              </p>
            </div>
          )}

          {/* Bottom Pagination */}
          {totalAlerts > 0 && (
            <div className="flex items-center justify-between mt-8 px-4 py-4 bg-white border border-border rounded-2xl flex-wrap gap-3">
              <div className="text-sm text-slate-600 tabular-nums">
                Showing {rangeStart}-{rangeEnd} of {totalAlerts} monitored activities
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

export default TikTokAlerts;
