import AvatarImage from '../AvatarImage'
import { FaTwitter, FaFacebook, FaYoutube, FaInstagram, FaTiktok, FaTelegram, FaSnapchat } from 'react-icons/fa'
import { SiBluesky } from 'react-icons/si'
import { MessageCircle } from 'lucide-react'

const PLATFORM_BADGES = {
  twitter: { icon: FaTwitter, color: '#1DA1F2', bg: '#1DA1F220', label: 'Twitter' },
  facebook: { icon: FaFacebook, color: '#1877F2', bg: '#1877F220', label: 'Facebook' },
  youtube: { icon: FaYoutube, color: '#FF0000', bg: '#FF000020', label: 'YouTube' },
  instagram: { icon: FaInstagram, color: '#E1306C', bg: '#E1306C20', label: 'Instagram' },
  tiktok: { icon: FaTiktok, color: '#d4d4d4', bg: '#d4d4d420', label: 'TikTok' },
  telegram: { icon: FaTelegram, color: '#2CA5E0', bg: '#2CA5E020', label: 'Telegram' },
  snapchat: { icon: FaSnapchat, color: '#FFFC00', bg: '#FFFC0020', label: 'Snapchat' },
  bluesky: { icon: SiBluesky, color: '#0085FF', bg: '#0085FF20', label: 'BlueSky' },
  zangi: { icon: MessageCircle, color: '#7B68EE', bg: '#7B68EE20', label: 'Zangi' },
}

const ACTIVITY_STYLES = {
  'Most Active': { background: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)' },
  'Not Active': { background: '#F1F5F9', color: '#64748B', border: '1px solid #E6EBF3' },
  'Medium': { background: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.2)' },
  default: { background: '#EFF6FF', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.18)' },
}

const getActivityLabel = (account) => {
  if (account.activity) return account.activity
  
  // If there's actual activity (posts/alerts), show it as active/medium
  const hasActivity = (account.alertCount || account.videoCount || 0) > 0;
  
  if (hasActivity) {
    // Account has posts - check how active
    if ((account.alertCount || account.videoCount || 0) > 10) return 'Most Active'
    return 'Medium'
  }
  
  // No activity yet - check if monitoring is working
  if (account.monitoringStatus === 'paused' || account.monitoringStatus === 'error') {
    return 'Not Active'
  }
  
  if (!account.monitoringActive) return 'Not Active'
  
  // Monitoring is active but no posts yet
  return 'Not Active'
}

const AccountRow = ({ account }) => {
  const label = getActivityLabel(account)
  const badgeStyle = ACTIVITY_STYLES[label] || ACTIVITY_STYLES.default
  const displayName = account.displayName || account.username || account.channelName || account.channelTitle || account.authorDisplayName || 'Unknown'
  const fallbackLabel = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 shadow-sm"
    >
      <AvatarImage
        src={account.profileImage || account.authorAvatar || account.channelThumbnail || account.channelProfileImage}
        alt={`${displayName} profile image`}
        size="sm"
        fallbackLabel={fallbackLabel}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <p className="text-sm font-medium text-slate-900 truncate">
            {displayName}
          </p>
          {account.platform && PLATFORM_BADGES[account.platform] && (
            <div className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" 
                 style={{ color: PLATFORM_BADGES[account.platform].color, background: PLATFORM_BADGES[account.platform].bg }}>
              {(() => {
                const Badge = PLATFORM_BADGES[account.platform].icon
                return <Badge size={10} />
              })()}
              <span>{PLATFORM_BADGES[account.platform].label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={badgeStyle}>
        {label}
      </div>
    </div>
  )
}

const PlatformAccounts = ({ accounts = [], loading }) => {
  return (
    <div style={{ height: '100%' }}>
      <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 300 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-slate-100" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-1/2 rounded-full bg-slate-100" />
                <div className="h-2 w-1/3 rounded-full bg-slate-100" />
              </div>
            </div>
          ))
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50 py-8 text-center text-sm text-slate-500">No accounts monitored</div>
        ) : (
          accounts.map((acc, i) => (
            <AccountRow key={acc._id || i} account={acc} />
          ))
        )}
      </div>
    </div>
  )
}

export default PlatformAccounts
