import { Info } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend,
} from 'recharts'
import { FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaTiktok, FaTelegram, FaSnapchat } from 'react-icons/fa'
import { SiBluesky } from 'react-icons/si'
import { MessageCircle } from 'lucide-react'
import { formatCount } from '../../services/realtimeService'

const PLATFORM_META = {
  Twitter: { Icon: FaTwitter, color: '#1DA1F2' },
  Facebook: { Icon: FaFacebook, color: '#1877F2' },
  YouTube: { Icon: FaYoutube, color: '#FF0000' },
  Instagram: { Icon: FaInstagram, color: '#E1306C' },
  TikTok: { Icon: FaTiktok, color: '#d4d4d4' },
  Telegram: { Icon: FaTelegram, color: '#2CA5E0' },
  Snapchat: { Icon: FaSnapchat, color: '#f59e0b' },
  BlueSky: { Icon: SiBluesky, color: '#0085FF' },
  Zangi: { Icon: MessageCircle, color: '#7B68EE' },
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div
        className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg"
      >
        <p className="font-medium text-slate-900">{payload[0].payload.name}</p>
        <p className="tabular-nums" style={{ color: payload[0].fill }}>{formatCount(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

const SourcesChart = ({ sources = [], loading, healthItems = [] }) => {
  const total = sources.reduce((a, b) => a + (b.value || 0), 0) || 1
  const sortedSources = [...sources].sort((a, b) => (b.value || 0) - (a.value || 0))
  const statusMap = new Map(healthItems.map((item) => [item.name, item]))

  return (
    <div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : sortedSources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No source data available yet
        </div>
      ) : (
        <>
          <div className="min-w-0 rounded-2xl bg-slate-50 px-2 py-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={sortedSources} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Legend />
                <Bar dataKey="value" name="Activity" radius={[10, 10, 0, 0]} maxBarSize={34}>
                  {sortedSources.map((s, i) => (
                    <Cell key={i} fill={s.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {sortedSources.map((s, i) => {
              const meta = PLATFORM_META[s.name]
              const Icon = meta?.Icon
              const statusItem = statusMap.get(s.name)
              const status = statusItem?.status || 'Offline'
              const isOnline = status === 'Online'
              return (
                <div key={i} className="rounded-xl border border-border bg-white px-3 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {Icon ? (
                        <Icon size={16} color={s.color || '#3b82f6'} />
                      ) : (
                        <div
                          style={{
                            width: 16, height: 16,
                            background: s.color || '#3b82f6',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                      <span className="truncate text-xs font-medium text-slate-700">{s.name}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] tabular-nums text-slate-500">{((s.value / total) * 100).toFixed(1)}%</span>
                    <span className="text-[11px] font-semibold tabular-nums text-slate-900">{formatCount(s.value)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default SourcesChart
