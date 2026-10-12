import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

const StatsCard = ({ title, value, change, icon: Icon, loading }) => {
  const isPositive = change && change.startsWith('+');

  if (loading) {
    return (
      <div className="card p-3.5 animate-pulse sm:p-4">
        <div className="h-5 bg-slate-100 rounded w-3/4 mb-2 sm:h-6"></div>
        <div className="h-7 bg-slate-100 rounded w-1/2 mb-2 sm:h-8"></div>
        <div className="h-4 bg-slate-100 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="card flex flex-col justify-between p-4 sm:p-5"
      whileHover={{ translateY: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h3 className="min-w-0 truncate text-xs font-medium text-slate-500 sm:text-sm">{title}</h3>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400 sm:h-5 sm:w-5" />}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">{value}</p>
        {change && (
          <div className="mt-1 flex flex-wrap items-center text-xs sm:text-sm">
            <span className={clsx('flex items-center', isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {isPositive ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              <span className="ml-1 font-semibold tabular-nums">{change}</span>
            </span>
            <span className="ml-2 text-slate-500">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;