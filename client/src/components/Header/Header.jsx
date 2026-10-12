import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Users,
  Image as ImageIcon,
  Video,
  Twitter,
  Facebook,
  Youtube,
  LayoutDashboard,
  Activity,
  ChevronDown,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { useState, useRef, useEffect } from "react";
import { useUnreadCountAll } from "../../hooks/useUnreadCountAll";
import { useAllAlertsNotification } from "../../hooks/useAllAlertsNotification";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { normalizeProfileImageUrl } from "../../utils/avatar";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const {
    unreadCount,
    markAlertViewed,
    syncUnreadFromServer,
  } = useSocket();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [localAlerts, setLocalAlerts] = useState([]);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { platform: routePlatform } = useParams();
  const limit = 5;

  const { data: unreadData } = useUnreadCountAll(); // Fetch unread counts from ALL platforms
  const totalUnread = Math.max(unreadData?.count || 0, unreadCount);
  const { data, isLoading, isFetching } = useAllAlertsNotification({
    limit,
    page: currentPage,
    enabled: showNotifications,
  });

  const displayName = user?.username || "Operator";
  const roleLabel = (user?.role || "operator").replace(/^\w/, (c) => c.toUpperCase());
  const initials = displayName
    .split(/[-_\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "OP";

  const handleLogout = () => {
    setShowUser(false);
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!showNotifications) return;
    if (!data?.alerts?.length) return;

    setLocalAlerts((prev) => {
      const seen = new Set(prev.map((alert) => alert?._id));
      const nextUnique = data.alerts.filter((alert) => alert?._id && !seen.has(alert._id));
      if (nextUnique.length === 0) return prev;
      return [...prev, ...nextUnique];
    });
  }, [data?.alerts, showNotifications]);

  useEffect(() => {
    if (showNotifications) return;
    setCurrentPage(1);
    setLocalAlerts([]);
  }, [showNotifications]);

  const dropdownAlerts = localAlerts;
  const pagination = data?.pagination || { total: 0, hasMore: false };

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUser(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    syncUnreadFromServer();
  }, [showNotifications, syncUnreadFromServer]);

  const platformConfig = {
    twitter: {
      label: "Twitter",
      color: "text-sky-700 border-sky-200",
      bgColor: "bg-sky-50",
      icon: Twitter,
    },
    facebook: {
      label: "Facebook",
      color: "text-blue-700 border-blue-200",
      bgColor: "bg-blue-50",
      icon: Facebook,
    },
    youtube: {
      label: "YouTube",
      color: "text-red-700 border-red-200",
      bgColor: "bg-red-50",
      icon: Youtube,
    },
    instagram: {
      label: "Instagram",
      color: "text-pink-700 border-pink-200",
      bgColor: "bg-pink-50",
    },
    tiktok: {
      label: "TikTok",
      color: "text-slate-800 border-slate-200",
      bgColor: "bg-slate-50",
    },
    telegram: {
      label: "Telegram",
      color: "text-cyan-700 border-cyan-200",
      bgColor: "bg-cyan-50",
    },
    snapchat: {
      label: "Snapchat",
      color: "text-amber-700 border-amber-200",
      bgColor: "bg-amber-50",
    },
    bluesky: {
      label: "BlueSky",
      color: "text-indigo-700 border-indigo-200",
      bgColor: "bg-indigo-50",
    },
    zangi: {
      label: "Zangi",
      color: "text-violet-700 border-violet-200",
      bgColor: "bg-violet-50",
    },
  };

  const getPlatformIcon = (platform) => {
    const config = platformConfig[platform];
    if (!config?.icon) return null;
    const Icon = config.icon;
    return <Icon size={12} />;
  };

  const getTypeIcon = (type) => {
    const icons = {
      tweet: "✍️",
      retweet: "🔁",
      reply: "💬",
      image: "🖼️",
      video: "🎥",
      thread: "🧵",
      quote: "❝",
    };
    return icons[type] || "📌";
  };

  const handleAlertClick = (alert) => {
    if (!alert?._id) return;

    markAlertViewed(alert._id, { alert });
    setShowNotifications(false);
    const platform = (alert.platform || "twitter").toLowerCase();
    navigate(`/alerts/${platform}/${alert._id}`);
  };

  // Shared nav items config (used by both mobile strip and desktop nav)
  const p = routePlatform || "all";
  const path = location.pathname;
  const navItems = [
    { label: "Overview", icon: LayoutDashboard, to: p === "all" ? "/dashboard" : `/dashboard/${p}`, active: path.startsWith("/dashboard"), disabled: false },
    { label: "Accounts", icon: Users, to: `/accounts/${p}`, active: path.startsWith("/accounts"), disabled: p === "all" },
    { label: "Alerts", icon: Bell, to: `/alerts/${p}`, active: path.startsWith("/alerts"), disabled: p === "all" },
    { label: "Activity", icon: Activity, to: "/activity", active: path.startsWith("/activity"), disabled: false },
  ];

  return (
    <header className="command-bar">
      {/* Main row: logo + desktop nav + icons */}
      <div className="mx-auto flex min-h-[64px] max-w-[1900px] items-center gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2 select-none sm:gap-3">
          <img
            src="/logo.png"
            alt="NIGRAN"
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold tracking-[0.18em] text-slate-900 sm:text-base sm:tracking-[0.24em]">
              NIGRAN
            </div>
            <div className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Media Intelligence Monitoring
            </div>
          </div>
        </Link>

        {/* Desktop nav - visible lg and up */}
        <nav className="mx-auto hidden items-center gap-1 rounded-2xl border border-border bg-slate-50/70 p-1 lg:flex">
          {navItems.map(({ label, icon: Icon, to, active, disabled }) =>
            disabled ? (
              <span
                key={label}
                title="Select a platform to view its accounts and alerts"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-transparent px-3.5 py-2 text-sm font-semibold text-slate-300"
              >
                <Icon size={16} />
                <span>{label}</span>
              </span>
            ) : (
              <Link
                key={label}
                to={to}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "border-border bg-white text-blue-700 shadow-sm"
                    : "border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((v) => {
                  const next = !v;
                  if (next) {
                    setCurrentPage(1);
                    setLocalAlerts([]);
                  }
                  return next;
                });
              }}
              className="relative rounded-xl border border-border bg-white p-2 text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 sm:p-2.5"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {totalUnread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm"
                >
                  {totalUnread > 99 ? "99+" : totalUnread}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{
                      duration: 0.15,
                      ease: "easeOut"
                    }}
                    style={{ willChange: "transform, opacity" }}
                    className="fixed inset-x-3 top-[64px] z-50 mt-2 max-h-[80vh] overflow-hidden rounded-2xl border border-border bg-white shadow-lift sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[26rem] sm:max-h-none"
                  >
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Alerts
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {totalUnread} unread
                    </span>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto sm:max-h-[28rem]">
                    {isLoading ? (
                      <div className="space-y-3 p-4">
                        {[...Array(3)].map((_, idx) => (
                          <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                      </div>
                    ) : dropdownAlerts.length === 0 ? (
                      <div className="px-6 py-10 text-center text-sm text-slate-500">
                        No alert history yet
                      </div>
                    ) : (
                      dropdownAlerts.map((alert, i) => {
                        const platform = (alert.platform || "twitter").toLowerCase();
                        const platformUi = platformConfig[platform] || {
                          label: platform,
                          color: "text-slate-600 border-slate-200",
                          bgColor: "bg-slate-50",
                        };
                        const media = Array.isArray(alert.media) ? alert.media[0] : null;
                        const isViewed = alert.isViewed;
                        const platformIcon = getPlatformIcon(platform);
                        const mediaPreview =
                          media?.previewUrl ||
                          media?.thumbnail ||
                          media?.image ||
                          media?.url;
                        const profileAvatar =
                          normalizeProfileImageUrl(
                            (platform === "youtube" && alert.channelProfileImage) ||
                            alert.profileImage
                          ) ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.username || "user"}`;

                        return (
                          <button
                            key={alert._id || i}
                            onClick={() => handleAlertClick(alert)}
                            className="w-full border-b border-border/70 px-5 py-4 text-left transition-colors hover:bg-slate-50 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={profileAvatar}
                                alt={alert.username || "alert"}
                                className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <span className="block truncate text-sm font-semibold text-slate-900">
                                        @{alert.username || "unknown"}
                                      </span>
                                      <span className="shrink-0 text-xs text-slate-500">
                                        {getTypeIcon(alert.activityType)}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="shrink-0 pt-0.5 text-[11px] text-slate-500">
                                        {alert.createdAt
                                          ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })
                                          : "just now"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <div
                                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${platformUi.color} ${platformUi.bgColor}`}
                                    >
                                      {platformIcon && <span className="flex items-center">{platformIcon}</span>}
                                      <span>{platformUi.label}</span>
                                    </div>
                                    {!isViewed && (
                                      <span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                                        ● New
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="mt-2 break-words text-xs leading-5 text-slate-600 line-clamp-3">
                                  {alert.content || `New ${alert.activityType} on ${platformUi.label}`}
                                </p>

                                {media && mediaPreview && (
                                  <div className="mt-3 flex h-24 w-full items-center overflow-hidden rounded-xl border border-border/60 bg-slate-50">
                                    <div className="relative h-full w-full">
                                      <img
                                        src={mediaPreview}
                                        alt="media preview"
                                        className="h-full w-full object-cover object-top"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                        }}
                                      />
                                      {(media.type === "video" || media.type === "animated_gif") && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                                          <Video size={12} />
                                        </div>
                                      )}
                                      <div className="absolute sr-only">
                                        <ImageIcon size={10} />
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {pagination.hasMore && (
                    <div className="border-t border-border px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={isFetching}
                        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isFetching ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          "Show More"
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUser((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-1.5 text-left shadow-xs transition-colors hover:bg-slate-50 sm:gap-2 sm:pr-2.5"
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold tracking-wide text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block max-w-[100px] truncate text-xs font-semibold text-slate-900 lg:max-w-[140px]">
                  {displayName}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {roleLabel}
                </span>
              </span>
              <ChevronDown size={15} className="hidden shrink-0 text-slate-400 sm:block" />
            </button>

            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 z-50 mt-3 w-60 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-lift"
                >
                  <div className="flex items-center gap-3 border-b border-border px-4 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <ShieldCheck size={12} /> {roleLabel} access
                      </p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile/tablet nav strip - always visible below main row, hidden on lg+ */}
      <div className="border-t border-border/70 bg-white/60 px-3 py-1.5 lg:hidden">
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-1.5 overflow-x-auto">
          {navItems.map(({ label, icon: Icon, to, active, disabled }) =>
            disabled ? (
              <span
                key={label}
                title="Select a platform to view its accounts and alerts"
                className="inline-flex shrink-0 cursor-not-allowed snap-start items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-slate-300"
              >
                <Icon size={14} />
                <span>{label}</span>
              </span>
            ) : (
              <Link
                key={label}
                to={to}
                className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;