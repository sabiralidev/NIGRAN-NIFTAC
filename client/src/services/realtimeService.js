// Real-time service wrapper - extends socket context events
// Used by dashboard components to subscribe to platform-specific updates

const realtimeSubscriptions = new Map()

export const subscribeToStats = (platform, callback) => {
  const key = `stats_${platform}`
  realtimeSubscriptions.set(key, callback)
  return () => realtimeSubscriptions.delete(key)
}

export const notifyStatsUpdate = (platform, data) => {
  const key = `stats_${platform}`
  const cb = realtimeSubscriptions.get(key)
  if (cb) cb(data)
}

// Platform colors
export const PLATFORM_COLORS = {
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  youtube: '#FF0000',
  instagram: '#E1306C',
  tiktok: '#111827',
  telegram: '#2CA5E0',
  snapchat: '#FFFC00',
  bluesky: '#0085FF',
  zangi: '#7B68EE',
}

// Platform display names
export const PLATFORM_NAMES = {
  twitter: 'Twitter',
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  snapchat: 'Snapchat',
  bluesky: 'BlueSky',
  zangi: 'Zangi',
}

// Format large numbers
export const formatCount = (n) => {
  if (!n && n !== 0) return '-'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
