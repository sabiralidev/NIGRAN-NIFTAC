import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PLATFORMS } from "../../utils/platformTheme";

const sectionFromPath = (pathname) => {
  if (pathname.startsWith("/accounts")) return "accounts";
  if (pathname.startsWith("/alerts")) return "alerts";
  return "dashboard";
};

/**
 * Full-width platform switcher (the sub-nav). Section navigation
 * (Overview / Accounts / Alerts) lives in the top command bar; this bar only
 * switches the active platform. Switching platform preserves the current
 * section so /accounts/twitter -> /accounts/youtube, etc.
 *
 * Responsive behavior:
 * - Mobile: horizontal scroll-snap strip, icon-only (labels hidden below sm),
 *   smaller paddings, edge fade so it's clear there's more to scroll.
 * - Tablet/Desktop: full tabs with icon + label, no scroll needed usually.
 */
const TopNav = () => {
  const navigate = useNavigate();
  const { platform: routePlatform } = useParams();
  const location = useLocation();

  const activePlatform = routePlatform || "all";
  const section = sectionFromPath(location.pathname);

  const selectPlatform = (id) => {
    if (id === "all") {
      navigate("/dashboard");
      return;
    }
    if (section === "accounts") navigate(`/accounts/${id}`);
    else if (section === "alerts") navigate(`/alerts/${id}`);
    else navigate(`/dashboard/${id}`);
  };

  return (
    <div className="sticky top-[64px] z-40 border-b border-border bg-white/80 backdrop-blur-md sm:top-[76px]">
      <div className="relative mx-auto max-w-[1900px] px-2 py-2 sm:px-6 sm:py-2.5 lg:px-8 xl:px-10">
        {/* edge fade hints - only really visible/needed while scrolling on small screens */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/90 to-transparent sm:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/90 to-transparent sm:hidden" />

        <div className="platform-tabs-track scrollbar-hide flex snap-x snap-mandatory gap-1.5 overflow-x-auto sm:gap-2 sm:overflow-visible">
          {PLATFORMS.map((p) => {
            const isActive = activePlatform === p.id;
            const Icon = p.Icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPlatform(p.id)}
                className={`platform-tab shrink-0 snap-start ${isActive ? "active" : ""}`}
                data-platform={p.id}
                style={
                  isActive
                    ? { color: p.text, borderColor: `${p.accent}55`, background: p.soft }
                    : undefined
                }
              >
                <span className="platform-tab-icon" style={{ color: p.brand }}>
                  <Icon size={16} className="sm:hidden" />
                  <Icon size={18} className="hidden sm:block" />
                </span>
                <span className="platform-tab-label hidden sm:inline">{p.short}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopNav;