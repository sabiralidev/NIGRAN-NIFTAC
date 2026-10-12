import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity } from 'lucide-react';
import { useUnreadCountAll } from '../hooks/useUnreadCountAll';
import { useAllAccountsSummary } from '../hooks/useAccounts';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/activity', icon: Activity, label: 'Activity' },
];

const Sidebar = () => {
  const { data: unreadData } = useUnreadCountAll();
  const { data: accountsSummary } = useAllAccountsSummary();

  const unread = unreadData?.count || 0;
  const activeAccounts = accountsSummary?.count || 0;

  return (
    <aside className="sticky top-16 z-30 border-b border-border bg-white/95 backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:bottom-0 lg:w-64 lg:border lg:border-l-0 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="hidden px-4 pt-4 lg:block xl:px-5 xl:pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Navigation</h2>
        <p className="mt-1 text-xs text-slate-500">Monitor activity and alerts</p>
      </div>
      <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3 lg:flex-col lg:px-4 lg:py-5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex min-w-fit shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm lg:w-full',
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-800 shadow-[inset_0_0_0_1px_rgba(30,64,175,0.1)]'
                  : 'border-transparent bg-transparent text-slate-600 hover:border-border hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <Icon size={18} className="shrink-0 sm:hidden" />
            <Icon size={20} className="hidden shrink-0 sm:block" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="hidden border-t border-border px-4 py-4 lg:block xl:px-5 xl:py-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Overview</h3>
        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Active Monitors</span>
            <span className="font-bold tabular-nums text-emerald-700">{activeAccounts}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Unread Alerts</span>
            <span className="font-bold tabular-nums text-red-700">{unread}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;