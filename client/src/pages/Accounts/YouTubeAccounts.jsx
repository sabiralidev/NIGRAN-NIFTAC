import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, UserX, X, AlertCircle, Loader, RefreshCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DashboardLayout from '../../layouts/DashboardLayout'
import AccountCard from '../../components/AccountCard'
import { youtubeAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import { FaYoutube } from 'react-icons/fa'
import { invalidateMonitoringQueries } from '../../utils/invalidateMonitoringQueries'

const platformConfig = {
  label: "YouTube",
  color: "#FF0000",
}

const PAGE_SIZE = 5

const AddAccountModal = ({ onClose, onSuccess }) => {
  const [channelId, setChannelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!channelId.trim()) {
        throw new Error('Please enter a Channel ID')
      }

      await youtubeAPI.addChannel({ channelId })
      toast.success('Channel added successfully!')
      setChannelId('')
      onSuccess()
      onClose()
    } catch (err) {
      const message = err.message || 'Failed to add channel'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Add {platformConfig.label} Channel</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-sm mb-2">YouTube Channel ID</label>
            <input
              type="text"
              placeholder="e.g., UCxxxxxxxxxxxxxxxx"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="input-field"
              required
              autoFocus
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Get your Channel ID from YouTube Studio or use a Channel URL
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: platformConfig.color }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Channel
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const YouTubeAccounts = () => {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    fetchChannels()
  }, [])

  // reset pagination whenever the search term changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchTerm])

  const fetchChannels = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await youtubeAPI.getChannels()
      setAccounts(Array.isArray(response) ? response : [])
    } catch (err) {
      const message = err.message || 'Failed to fetch channels'
      setError(message)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccount = async (accountId) => {
    try {
      const res = await youtubeAPI.removeChannel(accountId)
      await invalidateMonitoringQueries(queryClient)
      toast.success(res?.message || 'Channel removed successfully!')
      // remove only the deleted account from local state
      setAccounts((prev) => prev.filter((a) => a._id !== accountId))
    } catch (err) {
      toast.error(err.message || 'Failed to remove channel')
    }
  }

  const handleToggleStatus = async (accountId, status) => {
    try {
      const res = await youtubeAPI.updateChannelStatus(accountId, status)
      toast.success(res?.message || 'Channel status updated')
      // update only the affected account in local state
      setAccounts((prev) => prev.map((a) => (a._id === accountId ? { ...a, monitoringStatus: status } : a)))
    } catch (err) {
      toast.error(err.message || 'Failed to update channel status')
    }
  }

  const handleRefreshAccount = async (accountId) => {
    try {
      const res = await youtubeAPI.refreshChannel(accountId)
      toast.success(res?.message || 'Channel refreshed')
      const updated = res?.account
      if (updated) {
        setAccounts((prev) => prev.map((a) => (a._id === accountId ? updated : a)))
      }
    } catch (err) {
      toast.error(err.message || 'Failed to refresh channel')
    }
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.channelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const visibleAccounts = filteredAccounts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAccounts.length

  // ---- Derived stats for Quick Filters ----
  const activeCount = accounts.filter((a) => a.monitoringStatus === 'active').length

  const alertingCount = accounts.filter((a) => {
    // Account has alerts if:
    // 1. Has alerts array with items
    // 2. Has alertCount > 0
    // 3. Has hasAlerts === true
    return (a.alerts && Array.isArray(a.alerts) && a.alerts.length > 0) ||
           (a.alertCount && a.alertCount > 0) ||
           a.hasAlerts === true
  }).length

  const inactiveCount = accounts.filter((a) => a.monitoringStatus === 'paused' || a.monitoringStatus === 'error').length

  return (
    <DashboardLayout>
      <AnimatePresence>
        {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={fetchChannels} />}
      </AnimatePresence>

      {/* Header row: Heading - Search - Add Channel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
    <FaYoutube 
      size={28} 
      style={{ color: platformConfig.color }}
    />
    <span>{platformConfig.label}</span> Accounts
  </h1>
  <p className="text-sm text-slate-500 mt-1">
    Managing <span className="font-semibold text-slate-900">{accounts.length}</span> channel{accounts.length === 1 ? '' : 's'} across the broadcast network.
  </p>
</div>

        <div className="relative w-full sm:flex-1 sm:max-w-xl">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <motion.button
          onClick={() => setShowAddModal(true)}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto sm:flex-shrink-0"
          style={{ backgroundColor: platformConfig.color }}
        >
          <Plus size={16} />
          Add Channel
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ---- Left side panel: Quick Filters ---- */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white border border-border rounded-2xl shadow-card p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Filters</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Active
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Alerting
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">{alertingCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Inactive
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">{inactiveCount}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ---- Main content ---- */}
        <div className="flex-1 min-w-0 w-full">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error loading channels</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={40} className="animate-spin text-slate-500" />
            </div>
          ) : filteredAccounts.length > 0 ? (
            <>
              <div className="bg-white border border-border rounded-2xl shadow-card overflow-visible">
                <div className="min-w-[560px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_120px_90px_70px] gap-4 px-5 py-3 bg-slate-50 border-b border-border">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Channel Name</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alerts</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</span>
                  </div>

                  {/* Rows */}
                  <motion.div className="divide-y divide-border">
                    <AnimatePresence initial={false}>
                      {visibleAccounts.map((account) => (
                        <AccountCard
                          key={account._id}
                          account={account}
                          platform="youtube"
                          onRemove={handleRemoveAccount}
                          onToggle={handleToggleStatus}
                          onRefresh={handleRefreshAccount}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button onClick={handleLoadMore} className="btn-secondary px-6 w-full sm:w-auto">
                    Load More Accounts
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <UserX size={48} className="mx-auto text-slate-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-600">
                {searchTerm ? 'No Channels Found' : 'No Channels Added'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchTerm
                  ? `No YouTube channels match your search.`
                  : `Start monitoring YouTube channels by adding one.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default YouTubeAccounts
