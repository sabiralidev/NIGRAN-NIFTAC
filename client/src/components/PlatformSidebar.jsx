import { motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bell,
  ArrowLeft,
} from "lucide-react";
import clsx from "clsx";

const getPlatformConfig = (platform) => {
  const configs = {
    twitter: { color: "#1DA1F2", label: "Twitter" },
    facebook: { color: "#1877F2", label: "Facebook" },
    instagram: { color: "#E1306C", label: "Instagram" },
    tiktok: { color: "#000000", label: "TikTok" },
    snapchat: { color: "#FFFC00", label: "Snapchat" },
    telegram: { color: "#2CA5E0", label: "Telegram" },
    bluesky: { color: "#0085FF", label: "BlueSky" },
    youtube: { color: "#FF0000", label: "YouTube" },
    zangi: { color: "#7B68EE", label: "Zangi" },
  };
  return configs[platform] || { color: "#58A6FF", label: "Platform" };
};

const sidebarVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: -288, opacity: 0 },
};

const sidebarTransition = {
  x: { type: "tween", duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  opacity: { type: "tween", duration: 0.12, ease: "linear" },
};

const PlatformSidebar = () => {
  const { platform } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  if (!platform) return null;

  const { color, label } = getPlatformConfig(platform);

  const navItems = [
    { to: `/dashboard/${platform}`, icon: LayoutDashboard, label: "Dashboard" },
    { to: `/accounts/${platform}`, icon: Users, label: "Accounts" },
    { to: `/alerts/${platform}`, icon: Bell, label: "Alerts" },
  ];

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="closed"
      animate="open"
      exit="closed"
      transition={sidebarTransition}
      className="sticky top-16 z-30 border-b border-border bg-white/95 backdrop-blur transform-gpu lg:fixed lg:left-0 lg:top-20 lg:bottom-0 lg:w-64 lg:border lg:border-l-0 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"
      style={{ willChange: "transform" }}
    >
      <div className="hidden border-b border-border px-4 py-4 lg:flex lg:items-center lg:gap-3 xl:px-5 xl:py-5">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border border-border bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          title="Back to all platforms"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color }}>{label}</p>
          <p className="text-xs text-slate-500">Platform View</p>
        </div>
      </div>

      <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3 lg:flex-1 lg:flex-col lg:px-4 lg:py-5">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex min-w-fit shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:px-4 sm:py-3 sm:text-sm lg:hidden"
        >
          <ArrowLeft size={16} className="sm:hidden" />
          <ArrowLeft size={18} className="hidden sm:block" />
          <span>All Platforms</span>
        </button>
        {navItems.map(({ to, icon: Icon, label: navLabel }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={clsx(
              "group flex min-w-fit shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm lg:w-full",
              location.pathname.startsWith(to)
                ? "bg-opacity-10 text-white"
                : "border-transparent text-slate-600 hover:border-border hover:bg-slate-50 hover:text-slate-900"
            )}
            style={{
              backgroundColor: location.pathname.startsWith(to) ? `${color}11` : "transparent",
              borderColor: location.pathname.startsWith(to) ? `${color}44` : undefined,
              color: location.pathname.startsWith(to) ? color : undefined,
            }}
          >
            <Icon size={18} className="shrink-0 sm:hidden" style={{ color: location.pathname.startsWith(to) ? color : "inherit" }} />
            <Icon size={20} className="hidden shrink-0 sm:block" style={{ color: location.pathname.startsWith(to) ? color : "inherit" }} />
            <span className="truncate">{navLabel}</span>
          </button>
        ))}
      </nav>
    </motion.aside>
  );
};

export default PlatformSidebar;