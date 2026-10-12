import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import ActivityTimeline from '../components/ActivityTimeline'
import LoadingSpinner from '../components/LoadingSpinner'
import { activityPlatformOptions, useActivityFeed } from '../hooks/useAlerts'
import { useSocket } from '../context/SocketContext'

const ActivityPage = () => {
  const [page, setPage] = useState(1)
  const [platformFilter, setPlatformFilter] = useState('all')
  const { onNewAlert } = useSocket()

  const { data, isLoading, refetch } = useActivityFeed({
    page,
    limit: 30,
    platform: platformFilter,
  })

  const alerts = data?.alerts || []
  const pagination = data?.pagination || {}
  const platformOptions = data?.platforms || activityPlatformOptions

  useEffect(() => {
    const unsubscribe = onNewAlert(() => {
      if (page === 1) refetch()
    })
    return unsubscribe
  }, [onNewAlert, page, refetch])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Activity Feed</h1>
            <p className="text-slate-500 text-sm mt-0.5">Live timeline of all monitored account activity across connected platforms</p>
          </div>
          <button onClick={() => refetch()} className="btn-secondary p-2">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Platform filter */}
        <div className="flex gap-2 flex-wrap">
          {platformOptions.map((platform) => (
            <button
              key={platform.id}
              onClick={() => {
                setPlatformFilter(platform.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platformFilter === platform.id
                  ? 'bg-accent-blue text-white'
                  : 'bg-white text-slate-500 border border-border hover:bg-slate-50'
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>

        <div className="card">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Loading activity..." />
            </div>
          ) : (
            <>
              <ActivityTimeline alerts={alerts} maxItems={30} />

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Older
                  </button>
                  <span className="text-slate-400 text-sm tabular-nums">Page {page} of {pagination.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Newer
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ActivityPage
