import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ListFilter, Calendar, Search, BellOff, CheckCheck, Repeat2, MessageSquare, Quote, FileText, Image, Video, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import AlertCard from '../../components/AlertCard'
import { useSocket } from '../../context/SocketContext'
import { useAlerts, useMarkAllAlertsRead } from '../../hooks/useAlerts'
import { detectTwitterPostType, twitterFilterTypes } from '../../utils/twitterPostTypeDetection'
import LoadingSpinner from '../../components/LoadingSpinner'

const platformConfig = {
  label: "Twitter",
  color: "#1DA1F2",
}

const postTypeConfig = {
  ALL: { label: "All", icon: SlidersHorizontal, color: "gray" },
  TWEET: { label: "Tweet", icon: FileText, color: "blue" },
  RETWEET: { label: "Retweet", icon: Repeat2, color: "green" },
  REPLY: { label: "Reply", icon: MessageSquare, color: "purple" },
  QUOTE: { label: "Quote", icon: Quote, color: "red" },
  IMAGE: { label: "Image", icon: Image, color: "cyan" },
  VIDEO: { label: "Video", icon: Video, color: "orange" },
  THREAD: { label: "Thread", icon: Layers, color: "yellow" },
};

const TwitterAlerts = () => {
  const { syncUnreadFromServer, stopAlertRing, removeToastForAlert } = useSocket();
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState('newest')
  const [postTypeFilter, setPostTypeFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [dismissedIds, setDismissedIds] = useState(() => new Set())
  const navigate = useNavigate();
  // Map our uppercase filter types to backend lowercase activity types
  const getBackendActivityType = (filterType) => {
    switch(filterType) {
      case 'TWEET': return 'tweet';
      case 'RETWEET': return 'retweet';
      case 'REPLY': return 'reply';
      case 'QUOTE': return 'quote';
      case 'IMAGE': return 'image';
      case 'VIDEO': return 'video';
      case 'THREAD': return null; // THREAD doesn't have a backend activity type yet
      default: return null;
    }
  };

  const backendActivityType = getBackendActivityType(postTypeFilter);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [postTypeFilter, searchTerm]);

  const { data, isLoading, isError } = useAlerts({
    page: currentPage,
    limit: pageSize,
    sort,
    platform: "twitter",
    ...(backendActivityType && { activityType: backendActivityType })
  })
  const markAllReadMutation = useMarkAllAlertsRead();

  const alerts = data?.alerts || []
  const pagination = data?.pagination || {}
  const totalAlerts = pagination.total || 0
  const totalPages = pagination.pages || 1

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        syncUnreadFromServer();
      },
    });
  };

  const handleAlertClick = (alertId) => {
    navigate(`/alerts/twitter/${alertId}`);
  };

  // Client-side only: hides the alert from view. Not persisted to the backend
  // since no dismiss endpoint currently exists.
  const handleDismiss = (alertId) => {
    removeToastForAlert(alertId);
    setDismissedIds((prev) => new Set(prev).add(alertId));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Filter and sort logic
  const filteredAlerts = (alerts || [])
    .filter(alert => !dismissedIds.has(alert._id))
    .filter(alert => {
      // Search filter
      const matchesSearch = (alert.content || '').toLowerCase().includes(searchTerm.toLowerCase())

      // Thread filter (client-side only since backend doesn't have thread activity type yet)
      let matchesType = true
      if (postTypeFilter === 'THREAD') {
        const detectedType = detectTwitterPostType(alert.activityType, alert.media, alert.content)
        matchesType = detectedType === 'THREAD'
      }

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.tweetCreatedAt || b.timestamp) - new Date(a.tweetCreatedAt || a.timestamp)
      if (sort === 'oldest') return new Date(a.tweetCreatedAt || a.timestamp) - new Date(b.tweetCreatedAt || b.timestamp)
      return 0
    })

  // Separate alerts into viewed and unviewed
  const unviewedAlerts = filteredAlerts.filter(alert => !alert.isRead)
  const viewedAlerts = filteredAlerts.filter(alert => alert.isRead)

  const rangeStart = totalAlerts === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalAlerts)

  return (
    <DashboardLayout>
      {/* Header row: Heading + stats (left) - Sort + Filter (right) */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span style={{ color: platformConfig.color }}>{platformConfig.label}</span> Alerts
          </h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <p className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-800 tabular-nums">{totalAlerts}</span> alerts
            </p>
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <CheckCheck size={16} />
              {markAllReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
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
          <span className="text-xs text-slate-600 font-semibold mr-2">Post Type:</span>
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
                    : 'bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-500 hover:text-slate-800'
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
          <h3 className="mt-4 text-lg font-semibold text-red-800">Error Loading Alerts</h3>
          <p className="mt-1 text-sm text-slate-600">Could not fetch Twitter alerts.</p>
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
                {unviewedAlerts.map(alert => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    platform="twitter"
                    onView={() => handleAlertClick(alert._id)}
                    onDismiss={handleDismiss}
                    variant="compact"
                  />
                ))}
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
                {viewedAlerts.map(alert => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    platform="twitter"
                    onView={() => handleAlertClick(alert._id)}
                    onDismiss={handleDismiss}
                    variant="compact"
                  />
                ))}
              </motion.div>
            </div>
          )}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
              <BellOff size={48} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700">No Alerts Found</h3>
              <p className="mt-1 text-sm text-slate-600">
                There are no {platformConfig.label} alerts matching your criteria.
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
  )
}

export default TwitterAlerts
