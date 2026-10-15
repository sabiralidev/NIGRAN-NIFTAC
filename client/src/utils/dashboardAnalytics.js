import { PLATFORM_COLORS, PLATFORM_NAMES } from "../services/realtimeService";

export const DASHBOARD_RANGE_OPTIONS = [
  { id: "1h", label: "Last Hour" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
];

const SEVERITY_TERMS = {
  critical: [
    "critical",
    "attack",
    "breach",
    "urgent",
    "explosive",
    "violence",
    "threat",
  ],
  high: ["warning", "escalation", "spike", "alert", "breaking", "risk"],
  medium: ["update", "monitor", "watch", "trend", "signal"],
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getItemTimestamp = (item) =>
  item?.createdAt || item?.timestamp || item?.tweetCreatedAt || item?.publishedAt;

export const getDateForItem = (item) => {
  const raw = getItemTimestamp(item);
  const parsed = raw ? new Date(raw) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const getRangeStart = (range, now = new Date()) => {
  const base = new Date(now);
  switch (range) {
    case "1h":
      return new Date(base.getTime() - 60 * 60 * 1000);
    case "today": {
      const start = new Date(base);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "30d":
      return new Date(base.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(base.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(base.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};

const toBucketLabel = (date, range) => {
  if (range === "1h") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (range === "today") {
    return `${String(date.getHours()).padStart(2, "0")}:00`;
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const mergeUniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.platform || "unknown"}:${item._id || item.postUrl || item.authorUsername || Math.random()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeMention = (item = {}, fallbackPlatform = "all") => {
  const platform = String(item.platform || fallbackPlatform || "unknown").toLowerCase();
  const metrics = item.metrics || {};

  return {
    ...item,
    platform,
    platformLabel: PLATFORM_NAMES[platform] || platform,
    createdAt: getDateForItem(item).toISOString(),
    authorUsername:
      item.authorUsername ||
      item.username ||
      item.source ||
      item.channelName ||
      item.channelTitle ||
      "Unknown",
    authorDisplayName:
      item.authorDisplayName ||
      item.displayName ||
      item.authorUsername ||
      item.username ||
      item.source ||
      item.channelName ||
      item.channelTitle ||
      "Unknown",
    content: item.content || item.message || item.caption || item.videoTitle || "",
    postType: item.postType || item.activityType || "post",
    metrics: {
      likes: toNumber(metrics.likes ?? item.likes ?? item.likesCount ?? item.likeCount),
      comments: toNumber(
        metrics.comments ?? item.comments ?? item.commentsCount ?? item.commentCount,
      ),
      shares: toNumber(metrics.shares ?? item.shares ?? item.sharesCount),
      views: toNumber(metrics.views ?? item.views ?? item.viewsCount ?? item.viewCount),
      reach: toNumber(metrics.reach ?? item.reach),
    },
  };
};

export const filterMentionsByRange = (mentions = [], range = "7d") => {
  const now = new Date();
  const start = getRangeStart(range, now);
  return mentions.filter((item) => getDateForItem(item).getTime() >= start.getTime());
};

export const buildTrendSeries = ({
  mentions = [],
  timeline = [],
  range = "7d",
  stats = {},
}) => {
  if ((range === "7d" || range === "30d" || range === "90d") && timeline.length > 0) {
    const sentiment = stats?.sentiment || {};
    const posRatio = toNumber(sentiment.positive) / 100 || 0;
    const negRatio = toNumber(sentiment.negative) / 100 || 0;
    const neuRatio = Math.max(0, 1 - posRatio - negRatio);

    return timeline.map((entry, index) => {
      const baseCount = toNumber(entry.count);
      const label = entry.label || entry._id || entry.date || `Point ${index + 1}`;
      return {
        label,
        alerts: baseCount,
        positive: Math.round(baseCount * posRatio),
        neutral: Math.round(baseCount * neuRatio),
        negative: Math.round(baseCount * negRatio),
      };
    });
  }

  const filtered = filterMentionsByRange(mentions, range);
  const buckets = new Map();

  filtered.forEach((item) => {
    const date = getDateForItem(item);
    const key =
      range === "1h"
        ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`
        : range === "today"
          ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
          : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!buckets.has(key)) {
      buckets.set(key, {
        label: toBucketLabel(date, range),
        alerts: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.alerts += 1;

    const severity = classifySeverity(item);
    if (severity === "Critical" || severity === "High") bucket.negative += 1;
    else if (severity === "Medium") bucket.neutral += 1;
    else bucket.positive += 1;
  });

  return Array.from(buckets.values());
};

export const derivePlatformDistribution = (mentions = [], sources = []) => {
  if (sources.length > 0) {
    return sources.map((source) => ({
      name: source.name,
      value: toNumber(source.value),
      color:
        source.color ||
        PLATFORM_COLORS[String(source.name || "").toLowerCase()] ||
        "#3b82f6",
    }));
  }

  const map = mentions.reduce((acc, item) => {
    const platform = String(item.platform || "other").toLowerCase();
    const name = PLATFORM_NAMES[platform] || platform;
    if (!acc[name]) {
      acc[name] = {
        name,
        value: 0,
        color: PLATFORM_COLORS[platform] || "#3b82f6",
      };
    }
    acc[name].value += 1;
    return acc;
  }, {});

  return Object.values(map).sort((a, b) => b.value - a.value);
};

export const deriveEngagementBreakdown = (mentions = []) => {
  const totals = mentions.reduce(
    (acc, item) => {
      acc.likes += toNumber(item.metrics?.likes);
      acc.comments += toNumber(item.metrics?.comments);
      acc.shares += toNumber(item.metrics?.shares);
      acc.views += toNumber(item.metrics?.views);
      acc.reach += toNumber(item.metrics?.reach || item.metrics?.views);
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, views: 0, reach: 0 },
  );

  const baseInteractions = totals.likes + totals.comments + totals.shares;
  const engagementRate = totals.reach > 0 ? (baseInteractions / totals.reach) * 100 : 0;

  return {
    totals,
    chartData: [
      { name: "Likes", value: totals.likes, color: "#60a5fa" },
      { name: "Comments", value: totals.comments, color: "#a78bfa" },
      { name: "Shares", value: totals.shares, color: "#34d399" },
      { name: "Views", value: totals.views, color: "#f59e0b" },
    ],
    engagementRate,
  };
};

export const classifySeverity = (item = {}) => {
  const content = String(item.content || item.message || item.caption || "").toLowerCase();
  const engagement =
    toNumber(item.metrics?.likes) +
    toNumber(item.metrics?.comments) * 1.5 +
    toNumber(item.metrics?.shares) * 2 +
    toNumber(item.metrics?.views) / 50;

  if (SEVERITY_TERMS.critical.some((term) => content.includes(term)) || engagement >= 180) {
    return "Critical";
  }

  if (SEVERITY_TERMS.high.some((term) => content.includes(term)) || engagement >= 80) {
    return "High";
  }

  if (SEVERITY_TERMS.medium.some((term) => content.includes(term)) || engagement >= 20) {
    return "Medium";
  }

  return "Low";
};

export const deriveAlertAnalytics = (mentions = [], liveAlerts = [], overrides = {}) => {
  const filteredLive = liveAlerts.map((item) => normalizeMention(item, item.platform || "all"));
  const merged = mergeUniqueById([...filteredLive, ...mentions]);

  const summary = {
    total: merged.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolved: 0,
    pending: 0,
    ignored: 0,
  };

  merged.forEach((item) => {
    const severity = classifySeverity(item);
    summary[severity.toLowerCase()] += 1;

    const status = String(item.status || "").toLowerCase();

    if (item.isViewed || item.isRead || status === "viewed" || status === "resolved") {
      summary.resolved += 1;
    } else {
      summary.pending += 1;
    }

    if (item.isIgnored || status === "ignored") {
      summary.ignored += 1;
    }
  });

  if (Number.isFinite(overrides.ignored)) {
    summary.ignored = Math.max(0, overrides.ignored);
  }

  if (Number.isFinite(overrides.total)) {
    summary.total = Math.max(0, overrides.total);
  }

  if (Number.isFinite(overrides.pending)) {
    summary.pending = Math.max(0, overrides.pending);
  }

  if (Number.isFinite(overrides.resolved)) {
    summary.resolved = Math.max(0, overrides.resolved);
  } else if (Number.isFinite(overrides.total) && Number.isFinite(overrides.pending)) {
    summary.resolved = Math.max(0, summary.total - summary.pending - summary.ignored);
  }

  return {
    summary,
    severityData: [
      { name: "Critical", value: summary.critical, color: "#ef4444" },
      { name: "High", value: summary.high, color: "#f97316" },
      { name: "Medium", value: summary.medium, color: "#eab308" },
      { name: "Low", value: summary.low, color: "#22c55e" },
    ],
    statusData: [
      { name: "Resolved", value: summary.resolved, color: "#34d399" },
      { name: "Pending", value: summary.pending, color: "#60a5fa" },
      { name: "Ignored", value: summary.ignored, color: "#64748b" },
    ],
  };
};

export const deriveKeywordInsights = (mentions = [], keywords = []) => {
  const keywordList = Array.isArray(keywords)
    ? keywords
    : Array.isArray(keywords?.keywords)
      ? keywords.keywords
      : Array.isArray(keywords?.data)
        ? keywords.data
        : [];

  const normalizedKeywords = new Set(
    keywordList
      .map((entry) => String(entry.word || entry.keyword || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const timeline = mentions
    .slice()
    .sort((a, b) => getDateForItem(a) - getDateForItem(b));
  const midpoint = Math.max(1, Math.floor(timeline.length / 2));
  const previous = timeline.slice(0, midpoint);
  const current = timeline.slice(midpoint);

  const countTerms = (items) => {
    const terms = {};
    items.forEach((item) => {
      const content = String(item.content || "").toLowerCase();
      const matches = content.match(/#[\w-]+|[\w-]{4,}/g) || [];
      matches.forEach((token) => {
        const clean = token.replace(/[^\w#-]/g, "");
        if (!clean) return;
        if (!clean.startsWith("#") && !normalizedKeywords.has(clean)) return;
        if (!terms[clean]) terms[clean] = 0;
        terms[clean] += 1;
      });
    });
    return terms;
  };

  const previousTerms = countTerms(previous);
  const currentTerms = countTerms(current);

  return Object.entries(currentTerms)
    .map(([term, value]) => {
      const prevValue = toNumber(previousTerms[term]);
      const delta = value - prevValue;
      return {
        term,
        value,
        previous: prevValue,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        delta,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

export const deriveHeatmap = (mentions = []) => {
  const grid = WEEKDAY_LABELS.map((day) => ({
    day,
    cells: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      value: 0,
    })),
  }));

  mentions.forEach((item) => {
    const date = getDateForItem(item);
    const day = date.getDay();
    const hour = date.getHours();
    grid[day].cells[hour].value += 1;
  });

  const maxValue = Math.max(
    1,
    ...grid.flatMap((row) => row.cells.map((cell) => cell.value)),
  );

  return {
    maxValue,
    rows: grid,
  };
};

export const isMentionUnread = (item, unreadIdSet) => {
  const id = item?._id || item?.id;
  if (id && unreadIdSet?.has?.(id)) return true;

  if (typeof item?.isViewed === "boolean") return !item.isViewed;
  if (typeof item?.isRead === "boolean") return !item.isRead;

  const status = String(item?.status || "").toLowerCase();
  if (status === "viewed" || status === "resolved") return false;
  if (status === "pending" || status === "unviewed" || status === "unread") return true;

  return false;
};

const normalizeAccountKey = (username, displayName, platform) => {
  const raw = String(username || displayName || "unknown").trim();
  const slug = raw
    .replace(/^@+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `${String(platform || "all").toLowerCase()}:${slug || "unknown"}`;
};

const pickPreferredLabel = (current, candidate) => {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate.length > current.length ? candidate : current;
};

export const deriveTopAccounts = (mentions = [], accounts = [], unreadIdSet = null) => {
  const accountMap = mentions.reduce((acc, item) => {
    const key = normalizeAccountKey(
      item.authorUsername,
      item.authorDisplayName,
      item.platform,
    );

    if (!acc[key]) {
      acc[key] = {
        name: item.authorDisplayName || item.authorUsername || "Unknown",
        username: item.authorUsername || "",
        platform: item.platform || "all",
        alerts: 0,
        unreadAlerts: 0,
        engagement: 0,
        avatar:
          item.authorAvatar ||
          item.profileImage ||
          item.profilePic ||
          item.channelProfileImage ||
          "",
      };
    } else {
      acc[key].name = pickPreferredLabel(
        acc[key].name,
        item.authorDisplayName || item.authorUsername,
      );
      acc[key].username = pickPreferredLabel(acc[key].username, item.authorUsername);
      if (!acc[key].avatar) {
        acc[key].avatar =
          item.authorAvatar ||
          item.profileImage ||
          item.profilePic ||
          item.channelProfileImage ||
          "";
      }
    }

    acc[key].alerts += 1;
    if (isMentionUnread(item, unreadIdSet)) {
      acc[key].unreadAlerts += 1;
    }
    acc[key].engagement +=
      toNumber(item.metrics?.likes) +
      toNumber(item.metrics?.comments) +
      toNumber(item.metrics?.shares);

    return acc;
  }, {});

  accounts.forEach((account) => {
    const username = account.username || account.handle || account.accountName;
    const key = normalizeAccountKey(username, account.displayName || account.title, account.platform);
    if (!username || accountMap[key]) return;

    accountMap[key] = {
      name: account.displayName || account.username || account.title || username,
      username: account.username || username,
      platform: account.platform || "all",
      alerts: toNumber(account.alertCount),
      unreadAlerts: 0,
      engagement: toNumber(account.engagement),
      avatar: account.profilePic || account.profileImage || account.avatar || "",
    };
  });

  return Object.values(accountMap)
    .sort((a, b) => b.alerts - a.alerts || b.unreadAlerts - a.unreadAlerts)
    .slice(0, 6);
};

export const deriveConnectionStats = (connected = {}, platform = "all") => {
  const entries =
    platform === "all"
      ? Object.entries(connected || {})
      : [[platform, Boolean(connected?.[platform])]];

  const online = entries.filter(([, isConnected]) => isConnected).length;
  const total = entries.length || 1;

  return {
    online,
    total,
    availability: Math.round((online / total) * 100),
    items: entries.map(([name, isConnected]) => ({
      name: PLATFORM_NAMES[name] || name,
      value: isConnected ? 1 : 0,
      status: isConnected ? "Online" : "Disconnected",
      color: isConnected ? "#34d399" : "#64748b",
    })),
  };
};

export const deriveLiveFeed = (mentions = [], liveAlerts = [], platform = "all") => {
  const merged = mergeUniqueById([
    ...liveAlerts.map((item) => normalizeMention(item, item.platform || platform)),
    ...mentions,
  ]);

  return merged
    .filter((item) => platform === "all" || item.platform === platform)
    .sort((a, b) => getDateForItem(b) - getDateForItem(a))
    .slice(0, 12);
};

export const getInitialRangeForDateRange = (dateRange) => {
  const numeric = Number(dateRange);
  if (numeric >= 90) return "90d";
  if (numeric >= 30) return "30d";
  if (numeric <= 1) return "today";
  return "7d";
};

export const buildAnalyticsExport = ({
  platform,
  range,
  trendSeries,
  platformDistribution,
  alerts,
  engagement,
  keywords,
  topAccounts,
  health,
}) => ({
  exportedAt: new Date().toISOString(),
  platform,
  range,
  trendSeries,
  platformDistribution,
  alerts,
  engagement,
  keywords,
  topAccounts,
  health,
});
