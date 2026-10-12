import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  alertsAPI,
  facebookAPI,
  youtubeAPI,
  instagramAPI,
  tiktokAPI,
} from "../services/api";
import { getProxiedImageUrl } from "../utils/imageProxy";
import toast from "react-hot-toast";

export const activityPlatformOptions = [
  { id: "all", label: "All Platforms" },
  { id: "twitter", label: "Twitter/X" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

const supportedActivityPlatforms = activityPlatformOptions
  .filter((platform) => platform.id !== "all")
  .map((platform) => platform.id);

const normalizeActivityType = (type, fallback = "post") => {
  const normalized = String(type || fallback).toLowerCase();
  const typeMap = {
    text: "post",
    photo: "image",
    reel: "video",
    story: "image",
    status: "post",
  };
  return typeMap[normalized] || normalized;
};

const normalizeTimestamp = (...timestamps) =>
  timestamps.find(Boolean) || new Date().toISOString();

const normalizeTwitterAlert = (alert) => ({
  ...alert,
  platform: "twitter",
  username: alert.username,
  displayName: alert.displayName || alert.username,
  profileImage: alert.profileImage || alert.profilePic,
  content:
    alert.content ||
    alert.text ||
    alert.fullText ||
    alert.tweetText ||
    alert.message ||
    "",
  activityType: normalizeActivityType(alert.activityType, "tweet"),
  media: Array.isArray(alert.media)
    ? alert.media.map((mediaItem) => ({
        ...mediaItem,
        type:
          mediaItem?.type === "photo"
            ? "image"
            : normalizeActivityType(mediaItem?.type, "image"),
        url:
          mediaItem?.url ||
          mediaItem?.preview_image_url ||
            mediaItem?.image_url ||
            (mediaItem?.type !== "video" ? mediaItem?.previewUrl : undefined),
        previewUrl:
          mediaItem?.previewUrl ||
          mediaItem?.preview_image_url ||
          mediaItem?.image_url ||
          mediaItem?.url,
      }))
    : [],
  createdAt: normalizeTimestamp(
    alert.createdAt,
    alert.tweetCreatedAt,
    alert.timestamp,
  ),
  isViewed:
    typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead,
  isRead: !!alert.isRead,
  sourceUrl: alert.sourceUrl || alert.tweetUrl,
});

const normalizeFacebookAlert = (alert) => ({
  ...alert,
  platform: "facebook",
  username: alert.authorUsername || alert.source,
  displayName: alert.authorDisplayName || alert.authorUsername || alert.source,
  profileImage:
    alert.authorProfilePic || alert.profileImage || alert.profilePic || "",
  content: alert.content || alert.message || "",
  activityType: normalizeActivityType(alert.postType, "post"),
  media: Array.isArray(alert.media)
    ? alert.media.map((mediaItem) => {
        const mediaUrl =
          mediaItem?.previewUrl ||
          mediaItem?.url ||
          mediaItem?.thumbnail ||
          mediaItem?.src ||
          mediaItem?.photo_image?.url ||
          mediaItem?.photo_image?.url1 ||
          mediaItem?.photo_image?.uri;

        return {
          ...mediaItem,
          type:
            mediaItem?.__typename === "Video"
              ? "video"
              : normalizeActivityType(
                  mediaItem?.type || mediaItem?.__typename,
                  "image",
                ),
          url: mediaUrl,
          previewUrl: mediaUrl,
        };
      })
    : [],
  createdAt: normalizeTimestamp(alert.createdAt, alert.timestamp),
  isViewed:
    typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead,
  isRead: !!alert.isRead,
  sourceUrl: alert.url || alert.sourceUrl,
});

const normalizeInstagramAlert = (alert) => {
  const media = [];
  const pushMedia = (url, type = "image") => {
    if (!url) return;
    // Use URLs directly without proxying for Instagram CDN
    media.push({
      type,
      url: url,
      previewUrl: url,
    });
  };

  if (Array.isArray(alert.media)) {
    alert.media.forEach((item) => {
      pushMedia(
        item?.url || item?.previewUrl,
        normalizeActivityType(item?.type, "image"),
      );
    });
  }

  if (Array.isArray(alert.images)) {
    alert.images.forEach((item) => {
      const mediaUrl =
        (typeof item === "string" && item) ||
        item?.url ||
        item?.displayUrl ||
        item?.imageUrl ||
        item?.src ||
        "";
      pushMedia(mediaUrl, "image");
    });
  }

  if (alert.displayUrl && media.length === 0) {
    pushMedia(
      alert.displayUrl,
      normalizeActivityType(alert.type || alert.postType, "image"),
    );
  }

  return {
    ...alert,
    platform: "instagram",
    username: alert.authorUsername || alert.source,
    displayName:
      alert.authorDisplayName || alert.authorUsername || alert.source,
    profileImage: alert.profileImage || alert.authorAvatar || "",
    content: alert.content || alert.caption || "",
    activityType: normalizeActivityType(alert.type || alert.postType, "post"),
    media: media.filter(
      (item, index, items) =>
        item.url &&
        items.findIndex((candidate) => candidate.url === item.url) === index,
    ),
    createdAt: normalizeTimestamp(alert.createdAt, alert.timestamp),
    isViewed:
      typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead,
    isRead: !!alert.isRead,
    sourceUrl: alert.url || alert.postUrl || alert.sourceUrl,
  };
};

const normalizeTikTokAlert = (alert) => {
  const media = [];
  if (Array.isArray(alert.images) && alert.images.length > 0) {
    alert.images.forEach((url) => {
      const proxied = getProxiedImageUrl(url);
      if (proxied || url) {
        media.push({
          type: "image",
          url: proxied || url,
          previewUrl: proxied || url,
        });
      }
    });
  } else if (alert.displayUrl) {
    const proxied = getProxiedImageUrl(alert.displayUrl);
    media.push({
      type: alert.videoUrl ? "video" : "image",
      url: proxied || alert.displayUrl,
      previewUrl: proxied || alert.displayUrl,
    });
  }

  return {
    ...alert,
    platform: "tiktok",
    username: alert.authorUsername || alert.source,
    displayName:
      alert.authorDisplayName || alert.authorUsername || alert.source,
    profileImage: alert.authorProfilePic || alert.profileImage || "",
    content: alert.content || "",
    activityType: normalizeActivityType(alert.postType, "video"),
    media,
    createdAt: normalizeTimestamp(alert.createdAt, alert.timestamp),
    isViewed:
      typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead,
    isRead: !!alert.isRead,
    sourceUrl: alert.url || alert.sourceUrl,
  };
};

const normalizeYoutubeVideo = (video) => ({
  ...video,
  platform: "youtube",
  username: video.channelName || video.channelTitle || "youtube",
  displayName: video.channelName || video.channelTitle || "YouTube",
  profileImage:
    video.channelProfileImage ||
    video.channelThumbnail ||
    video.thumbnail ||
    "",
  content: video.videoTitle || video.title || video.description || "",
  activityType: "video",
  media: video.thumbnail
    ? [
        {
          type: "image",
          url: video.thumbnail,
          previewUrl: video.thumbnail,
        },
      ]
    : [],
  createdAt: normalizeTimestamp(video.publishedAt, video.createdAt),
  isViewed:
    typeof video.isViewed === "boolean" ? video.isViewed : !!video.isRead,
  isRead: !!video.isRead,
  sourceUrl:
    video.url ||
    video.sourceUrl ||
    (video.videoId ? `https://youtube.com/watch?v=${video.videoId}` : null),
});

export const useActivityFeed = (params = {}) => {
  const { page = 1, limit = 30, platform = "all" } = params;

  return useQuery({
    queryKey: ["activityFeed", page, limit, platform],
    queryFn: async () => {
      const candidateLimit = Math.max(limit * page, limit);
      const [
        twitterResponse,
        facebookResponse,
        instagramResponse,
        tiktokResponse,
        youtubeResponse,
      ] = await Promise.allSettled([
        alertsAPI.getAll({ page: 1, limit: candidateLimit, sort: "newest" }),
        facebookAPI.getAlerts({
          page: 1,
          limit: candidateLimit,
          sort: "newest",
        }),
        instagramAPI.getAlerts({
          page: 1,
          limit: candidateLimit,
          sort: "newest",
        }),
        tiktokAPI.getAlerts({ page: 1, limit: candidateLimit, sort: "newest" }),
        youtubeAPI.getAllVideos({
          page: 1,
          limit: candidateLimit,
          sort: "newest",
        }),
      ]);

      const normalizedByPlatform = {
        twitter:
          twitterResponse.status === "fulfilled" &&
          Array.isArray(twitterResponse.value?.alerts)
            ? twitterResponse.value.alerts.map(normalizeTwitterAlert)
            : [],
        facebook:
          facebookResponse.status === "fulfilled" &&
          Array.isArray(facebookResponse.value?.alerts)
            ? facebookResponse.value.alerts.map(normalizeFacebookAlert)
            : [],
        instagram:
          instagramResponse.status === "fulfilled" &&
          Array.isArray(instagramResponse.value?.alerts)
            ? instagramResponse.value.alerts.map(normalizeInstagramAlert)
            : [],
        tiktok:
          tiktokResponse.status === "fulfilled" &&
          Array.isArray(tiktokResponse.value?.alerts)
            ? tiktokResponse.value.alerts.map(normalizeTikTokAlert)
            : [],
        youtube:
          youtubeResponse.status === "fulfilled" &&
          Array.isArray(youtubeResponse.value?.videos)
            ? youtubeResponse.value.videos.map(normalizeYoutubeVideo)
            : [],
      };

      const combinedAlerts = supportedActivityPlatforms
        .flatMap((platformId) => normalizedByPlatform[platformId] || [])
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

      const filteredAlerts =
        platform === "all"
          ? combinedAlerts
          : combinedAlerts.filter((alert) => alert.platform === platform);

      const total = filteredAlerts.length;
      const pages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paginatedAlerts = filteredAlerts.slice(start, start + limit);

      return {
        alerts: paginatedAlerts,
        pagination: {
          total,
          page,
          limit,
          pages,
          hasMore: page < pages,
        },
        platforms: activityPlatformOptions.map((platformOption) => ({
          ...platformOption,
          count:
            platformOption.id === "all"
              ? combinedAlerts.length
              : (normalizedByPlatform[platformOption.id] || []).length,
        })),
      };
    },
    keepPreviousData: true,
    staleTime: 5000,
    refetchOnMount: true,
  });
};

export const useAlerts = (params = {}) => {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertsAPI.getAll(params),
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to refetch on mount
    refetchOnMount: true, // Refetch when component mounts
  });
};

export const useAlertStats = () => {
  return useQuery({
    queryKey: ["alertStats"],
    queryFn: () => alertsAPI.getStats(),
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useAlertDetail = (id, platform = "twitter") => {
  return useQuery({
    queryKey: ["alert", id, platform],
    queryFn: async () => {
      if (platform === "facebook") {
        return facebookAPI.getAlert(id);
      }
      if (platform === "instagram") {
        return instagramAPI.getAlert(id);
      }
      if (platform === "tiktok") {
        return tiktokAPI.getAlert(id);
      }
      if (platform === "youtube") {
        const response = await youtubeAPI.getVideo(id);
        // Transform YouTube response to match alert detail structure
        return {
          ...response,
          alert: response.video,
          data: response.video,
        };
      }
      return alertsAPI.getOne(id);
    },
    enabled: !!id,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => alertsAPI.getUnreadCount(),
    refetchInterval: 10000,
  });
};

export const useMarkAlertsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertIds) => alertsAPI.markRead(alertIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
};

export const useMarkAllAlertsRead = (platform = "twitter") => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (platform === "facebook") {
        return facebookAPI.markAllRead();
      }
      if (platform === "instagram") {
        return instagramAPI.markAllRead();
      }
      if (platform === "tiktok") {
        return tiktokAPI.markAllRead();
      }
      return alertsAPI.markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      toast.success("All alerts marked as read");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useMarkAlertViewed = (platform = "twitter") => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => {
      if (platform === "facebook") {
        return facebookAPI.markViewed
          ? facebookAPI.markViewed(id)
          : Promise.resolve();
      }
      if (platform === "instagram") {
        return instagramAPI.markViewed
          ? instagramAPI.markViewed(id)
          : Promise.resolve();
      }
      if (platform === "tiktok") {
        return tiktokAPI.markViewed
          ? tiktokAPI.markViewed(id)
          : Promise.resolve();
      }
      if (platform === "youtube") {
        return youtubeAPI.markVideoAsViewed(id);
      }
      return alertsAPI.markViewed(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => alertsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alertStats"] });
      toast.success("Alert deleted");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteAllAlerts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertsAPI.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alertStats"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      toast.success("All alerts cleared");
    },
    onError: (error) => toast.error(error.message),
  });
};
