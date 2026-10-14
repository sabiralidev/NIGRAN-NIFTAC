import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ListFilter,
  Calendar,
  Search,
  BellOff,
  CheckCheck,
  Type,
  Image,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertCard from "../../components/AlertCard";
import { useSocket } from "../../context/SocketContext";
import {
  useFacebookAlerts,
  useMarkAllFacebookAlertsRead,
} from "../../hooks/facebook/useFacebookAlerts";
import { detectPostType } from "../../utils/postTypeDetection";
import LoadingSpinner from "../../components/LoadingSpinner";

const platformConfig = {
  label: "Facebook",
  color: "#1877F2",
};

const postTypeConfig = {
  ALL: { label: "All", icon: SlidersHorizontal, color: "gray" },
  TEXT: { label: "Text", icon: Type, color: "blue" },
  IMAGE: { label: "Image", icon: Image, color: "cyan" },
  VIDEO: { label: "Video", icon: Video, color: "orange" },
  CAROUSEL: { label: "Carousel", icon: SlidersHorizontal, color: "purple" },
};

const isFacebookMediaUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /fbcdn\.net|scontent|akamaihd/i.test(url) && !/emoji|static\.xx|icon|sprite/i.test(url);
};

const getFacebookMediaUrl = (media) => {
  const url = media?.url || media?.previewUrl || media?.photo_image?.url || media?.photo_image?.uri;
  return isFacebookMediaUrl(url) ? url : null;
};

const FacebookAlerts = () => {
  const navigate = useNavigate();
  const { syncUnreadFromServer, stopAlertRing, removeToastForAlert } = useSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [postTypeFilter, setPostTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [carouselIndices, setCarouselIndices] = useState({});
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [postTypeFilter, searchTerm]);

  const { data, isLoading, isError } = useFacebookAlerts({
    page: currentPage,
    limit: pageSize,
    sort,
  });
  const markAllReadMutation = useMarkAllFacebookAlertsRead();

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
    navigate(`/alerts/facebook/${alertId}`);
  };

  const handleDismiss = (alertId) => {
    removeToastForAlert(alertId);
    setDismissedIds((prev) => new Set(prev).add(alertId));
  };

  const handleCarouselNavigation = (alertId, direction) => {
    const currentIndex = carouselIndices[alertId] || 0;
    const alert = alerts.find((a) => a._id === alertId);
    const photoCount = (alert?.media || []).filter((m) => {
      const mediaType = String(m.type || m.__typename || "").toLowerCase();
      return (mediaType === "image" || mediaType === "photo" || mediaType === "video" || Boolean(m.photo_image)) && Boolean(getFacebookMediaUrl(m));
    }).length;

    if (!photoCount) return;

    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % photoCount
        : (currentIndex - 1 + photoCount) % photoCount;

    setCarouselIndices((prev) => ({
      ...prev,
      [alertId]: newIndex,
    }));
  };

  const renderCarouselAlert = (alert) => {
    const mediaItems = (alert.media || [])
      .filter((m) => {
        const mediaType = String(m.type || m.__typename || "").toLowerCase();
        return (mediaType === "image" || mediaType === "photo" || mediaType === "video" || Boolean(m.photo_image)) && Boolean(getFacebookMediaUrl(m));
      })
      .map((m) => ({
        type: String(m.type || m.__typename || "image").toLowerCase() === "video" ? "video" : "image",
        url: getFacebookMediaUrl(m),
      }));

    if (mediaItems.length === 0) {
      return (
        <AlertCard
          key={alert._id}
          alert={alert}
          platform="facebook"
          onView={() => handleAlertClick(alert._id)}
          onDismiss={handleDismiss}
          variant="compact"
        />
      );
    }

    const currentIndex = carouselIndices[alert._id] || 0;
    const currentMedia = mediaItems[currentIndex];
    const hasMultiple = mediaItems.length > 1;

    return (
      <div
        key={alert._id}
        className="bg-white border border-blue-400/30 rounded-2xl p-4 cursor-pointer hover:border-blue-400/50 transition-all"
        onClick={() => handleAlertClick(alert._id)}
      >
        <div className="flex items-start gap-4 mb-4">
          <img
            src={alert.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.source}`}
            alt={alert.source}
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900">{alert.source}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-400/40 text-blue-700 bg-blue-500/10 uppercase">
                Carousel
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-400/40 text-emerald-700 bg-emerald-500/10 uppercase">
                Viewed
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {new Date(
                alert.timestamp || alert.createdAt
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Carousel Display */}
        <div className="relative group rounded-lg overflow-hidden border border-border bg-slate-50">
          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.url}
              controls
              className="w-full h-64 object-cover transition-all duration-300"
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={`Carousel ${currentIndex + 1}`}
              className="w-full h-64 object-cover transition-all duration-300"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCarouselNavigation(alert._id, "prev");
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCarouselNavigation(alert._id, "next");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {hasMultiple && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 tabular-nums">
              <span className="font-medium">{currentIndex + 1}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-300">{mediaItems.length}</span>
            </div>
          )}
        </div>

        {hasMultiple && (
          <div className="flex justify-center gap-2 mt-3">
            {mediaItems.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndices((prev) => ({
                    ...prev,
                    [alert._id]: idx,
                  }));
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-blue-500 w-6"
                    : "bg-slate-400 w-2 hover:bg-slate-500"
                }`}
                title={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {alert.content && (
          <p className="mt-3 text-sm text-slate-700 line-clamp-2">
            {alert.content}
          </p>
        )}
      </div>
    );
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
    .filter(alert => !dismissedIds.has(alert._id))
    .filter((alert) => {
      // Search filter
      const matchesSearch = (alert.content || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Post type filter
      let matchesType = true;
      if (postTypeFilter !== "ALL") {
        const detectedType = detectPostType(alert.media, alert.postType);
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

  // Separate alerts into viewed and unviewed
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
            <p className="text-sm text-slate-600">
              Total:{" "}
              <span className="font-semibold text-slate-800 tabular-nums">{totalAlerts}</span>{" "}
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

        {/* Post Type Filters */}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${
                  isActive
                    ? `bg-${config.color}-500/10 text-${config.color}-700 border border-${config.color}-400/40`
                    : "bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-500 hover:text-slate-800"
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
          <BellOff size={48} className="mx-auto text-red-600" />
          <h3 className="mt-4 text-lg font-semibold text-red-800">
            Error Loading Alerts
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Could not fetch Facebook alerts.
          </p>
        </div>
      ) : (
        <>
          {/* Unviewed Posts Section */}
          {unviewedAlerts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-amber-700 tabular-nums">
                  Unviewed Posts ({unviewedAlerts.length})
                </h2>
              </div>
              <motion.div className="space-y-4">
                {unviewedAlerts.map((alert) => {
                  return (
                    <AlertCard
                      key={alert._id}
                      alert={alert}
                      platform="facebook"
                      onView={() => handleAlertClick(alert._id)}
                      onDismiss={handleDismiss}
                      variant="compact"
                    />
                  );
                })}
              </motion.div>
            </div>
          )}

          {/* Viewed Posts Section */}
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
                {viewedAlerts.map((alert) => {
                  return (
                    <AlertCard
                      key={alert._id}
                      alert={alert}
                      platform="facebook"
                      onView={() => handleAlertClick(alert._id)}
                      onDismiss={handleDismiss}
                      variant="compact"
                    />
                  );
                })}
              </motion.div>
            </div>
          )}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
              <BellOff size={48} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700">
                No Alerts Found
              </h3>
              <p className="mt-1 text-sm text-slate-600">
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

export default FacebookAlerts;