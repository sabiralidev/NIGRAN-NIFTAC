/**
 * Time-range model + bucketing for the real alerts timeline.
 *
 * A "range" is { key, label, start: Date, end: Date, bucket: 'hour'|'day'|'week'|'month' }.
 * Presets span hours -> days -> months; a custom range is user-picked start/end with an
 * auto-chosen bucket. The same range drives BOTH the data window and the graph's x-axis grid.
 */

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const RANGE_PRESETS = [
  { key: '6h', label: 'Last 6 hours', short: '6H', group: 'Hours', ms: 6 * HOUR, bucket: 'hour' },
  { key: '24h', label: 'Last 24 hours', short: '24H', group: 'Hours', ms: 24 * HOUR, bucket: 'hour' },
  { key: '7d', label: 'Last 7 days', short: '7D', group: 'Days', ms: 7 * DAY, bucket: 'day' },
  { key: '14d', label: 'Last 14 days', short: '14D', group: 'Days', ms: 14 * DAY, bucket: 'day' },
  { key: '30d', label: 'Last 30 days', short: '30D', group: 'Days', ms: 30 * DAY, bucket: 'day' },
  { key: '90d', label: 'Last 90 days', short: '90D', group: 'Days', ms: 90 * DAY, bucket: 'week' },
  { key: '6mo', label: 'Last 6 months', short: '6M', group: 'Months', ms: 182 * DAY, bucket: 'month' },
  { key: '12mo', label: 'Last 12 months', short: '12M', group: 'Months', ms: 365 * DAY, bucket: 'month' },
]

export const DEFAULT_RANGE_KEY = '7d'

export const makePresetRange = (key = DEFAULT_RANGE_KEY) => {
  const preset = RANGE_PRESETS.find((p) => p.key === key) || RANGE_PRESETS[2]
  const end = new Date()
  const start = new Date(end.getTime() - preset.ms)
  return { key: preset.key, label: preset.label, short: preset.short, start, end, bucket: preset.bucket }
}

// Auto-pick a sensible bucket for an arbitrary custom span.
export const bucketForSpan = (start, end) => {
  const span = end.getTime() - start.getTime()
  if (span <= 2 * DAY) return 'hour'
  if (span <= 45 * DAY) return 'day'
  if (span <= 180 * DAY) return 'week'
  return 'month'
}

export const makeCustomRange = (start, end) => {
  const s = start instanceof Date ? start : new Date(start)
  const e = end instanceof Date ? end : new Date(end)
  const bucket = bucketForSpan(s, e)
  return { key: 'custom', label: 'Custom range', short: 'Custom', start: s, end: e, bucket }
}

// Convert a range to an approximate "days" number for legacy day-based APIs.
export const rangeToDays = (range) =>
  Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / DAY))

const startOfBucket = (date, bucket) => {
  const d = new Date(date)
  d.setMilliseconds(0)
  d.setSeconds(0)
  if (bucket === 'hour') {
    d.setMinutes(0)
    return d
  }
  d.setMinutes(0)
  d.setHours(0)
  if (bucket === 'day') return d
  if (bucket === 'week') {
    const day = d.getDay() // 0 = Sun
    d.setDate(d.getDate() - day)
    return d
  }
  if (bucket === 'month') {
    d.setDate(1)
    return d
  }
  return d
}

const advanceBucket = (date, bucket) => {
  const d = new Date(date)
  if (bucket === 'hour') d.setHours(d.getHours() + 1)
  else if (bucket === 'day') d.setDate(d.getDate() + 1)
  else if (bucket === 'week') d.setDate(d.getDate() + 7)
  else if (bucket === 'month') d.setMonth(d.getMonth() + 1)
  return d
}

const labelForBucket = (date, bucket) => {
  if (bucket === 'hour') {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  if (bucket === 'month') {
    return date.toLocaleDateString([], { month: 'short', year: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const fullLabelForBucket = (date, bucket) => {
  if (bucket === 'hour') {
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  if (bucket === 'month') {
    return date.toLocaleDateString([], { month: 'long', year: 'numeric' })
  }
  if (bucket === 'week') {
    return `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Build an ordered array of empty buckets spanning the range, then tally each event
 * (any object with a timestamp field, or a raw date string) into its bucket.
 *
 * Returns [{ t: epochMs, label, fullLabel, count }].
 */
export const buildTimeSeries = (events = [], range) => {
  if (!range?.start || !range?.end) return []
  const { start, end, bucket } = range
  const buckets = []
  const index = new Map()

  let cursor = startOfBucket(start, bucket)
  const guard = 2000 // safety cap on bucket count
  let i = 0
  while (cursor.getTime() <= end.getTime() && i < guard) {
    const t = cursor.getTime()
    const entry = { t, label: labelForBucket(cursor, bucket), fullLabel: fullLabelForBucket(cursor, bucket), count: 0 }
    buckets.push(entry)
    index.set(t, entry)
    cursor = advanceBucket(cursor, bucket)
    i += 1
  }
  if (buckets.length === 0) return []

  const startMs = start.getTime()
  const endMs = end.getTime()

  for (const ev of events) {
    const raw = typeof ev === 'string' || ev instanceof Date
      ? ev
      : ev?.createdAt || ev?.timestamp || ev?.date || ev?.publishedAt
    if (!raw) continue
    const d = raw instanceof Date ? raw : new Date(raw)
    const ms = d.getTime()
    if (Number.isNaN(ms) || ms < startMs || ms > endMs) continue
    const key = startOfBucket(d, bucket).getTime()
    const entry = index.get(key)
    if (entry) entry.count += 1
  }

  return buckets
}

export const countInRange = (events = [], range) => {
  if (!range?.start || !range?.end) return 0
  const startMs = range.start.getTime()
  const endMs = range.end.getTime()
  let n = 0
  for (const ev of events) {
    const raw = typeof ev === 'string' || ev instanceof Date
      ? ev
      : ev?.createdAt || ev?.timestamp || ev?.date || ev?.publishedAt
    if (!raw) continue
    const ms = (raw instanceof Date ? raw : new Date(raw)).getTime()
    if (!Number.isNaN(ms) && ms >= startMs && ms <= endMs) n += 1
  }
  return n
}
