import { useState, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import TimeRangeControl from "../components/dashboard/TimeRangeControl";
import { makePresetRange } from "../utils/timeRange";
import { useSocket } from "../context/SocketContext";
import { getPlatformTheme } from "../utils/platformTheme";

const AllPlatformsDashboard = lazy(
  () => import("../platforms/all/AllPlatformsDashboard"),
);
const TwitterDashboard = lazy(
  () => import("../platforms/twitter/TwitterDashboard"),
);
const GenericPlatformDashboard = lazy(
  () => import("../platforms/GenericPlatformDashboard"),
);

const PlatformLoader = () => (
  <div className="flex items-center justify-center py-14 sm:py-20">
    <LoadingSpinner />
  </div>
);

const Dashboard = () => {
  const { platform: urlPlatform } = useParams();
  const activePlatform = urlPlatform || "all";
  const [range, setRange] = useState(() => makePresetRange());
  const { connected } = useSocket();
  const live = Object.values(connected || {}).some(Boolean);
  const theme = getPlatformTheme(activePlatform);

  const renderDashboard = () => {
    switch (activePlatform) {
      case "all":
        return <AllPlatformsDashboard range={range} />;
      case "twitter":
        return <TwitterDashboard range={range} />;
      default:
        return <GenericPlatformDashboard platform={activePlatform} range={range} />;
    }
  };

  const scopeLabel = activePlatform === "all" ? "Multi-platform" : theme.label;

  return (
    <DashboardLayout>
      <section
        className="dashboard-hero relative z-20 mb-6 rounded-3xl border border-border bg-white p-5 sm:mb-8 sm:p-7 lg:p-8"
        aria-label="Dashboard overview"
      >
        {/* Soft ambient accent glow, tinted by the active platform's color */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: theme.color || "#2563eb" }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: theme.color || "#2563eb" }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 sm:text-sm">
              {live ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              )}
              <span className="truncate">
                {live ? "Live" : "Offline"} · {scopeLabel} monitoring
              </span>
            </span>

            <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              {activePlatform === "all"
                ? "Media Intelligence"
                : `${theme.label} Intelligence`}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
              {activePlatform === "all"
                ? "Unified real-time monitoring, analytics, and alert activity across all connected platforms."
                : `Real-time monitoring, analytics, and alert activity for ${theme.label}.`}
            </p>
          </div>

          <div className="w-full shrink-0 sm:w-auto">
            <TimeRangeControl value={range} onChange={setRange} />
          </div>
        </div>
      </section>

      <div>
        <Suspense fallback={<PlatformLoader />}>{renderDashboard()}</Suspense>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;