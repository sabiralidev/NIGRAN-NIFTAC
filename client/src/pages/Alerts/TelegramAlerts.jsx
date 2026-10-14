import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ListFilter, Calendar, Search, BellOff } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import AlertCard from '../../components/AlertCard'
import { getPlatformDummyAlerts } from '../../utils/dummyData'

const platformConfig = {
  label: "Telegram",
  color: "#2CA5E0",
}

const TelegramAlerts = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState('newest')
  const alerts = getPlatformDummyAlerts('telegram')

  const filteredAlerts = alerts
    .filter(alert => alert.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.timestamp) - new Date(a.timestamp)
      if (sort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp)
      return 0
    })

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          <span style={{ color: platformConfig.color }}>{platformConfig.label}</span> Alerts
        </h1>
      </div>

      <div className="bg-white border border-border rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <ListFilter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field pl-10 appearance-none"
            >
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by date..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {filteredAlerts.length > 0 ? (
        <motion.div className="space-y-4">
          {filteredAlerts.map(alert => (
            <AlertCard key={alert._id} alert={alert} platform="telegram" />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
          <BellOff size={48} className="mx-auto text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-600">No Alerts Found</h3>
          <p className="mt-1 text-sm text-slate-500">
            There are no {platformConfig.label} alerts matching your criteria.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}

export default TelegramAlerts
