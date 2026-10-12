import { useQuery } from "@tanstack/react-query";
import {
  alertsAPI,
  facebookAPI,
  youtubeAPI,
  instagramAPI,
  tiktokAPI,
} from "../services/api";
import { getProxiedImageUrl } from "../utils/imageProxy";

/**
 * Fetch alerts from all platforms (Twitter, Facebook, YouTube, Instagram)
 * Combines results, normalizes structure, and sorts by timestamp (latest first)
 */
export const useAllAlertsNotification = (params = {}) => {
  const { limit = 5, page = 1, enabled = true } = params;

  return useQuery({
    queryKey: ["allAlertsNotification", limit, page],
    queryFn: async () => {
      try {
        // Fetch alerts from all platforms in parallel
        const [
          twitterResponse,
          facebookResponse,
          youtubeResponse,
          instagramResponse,
          tiktokResponse,
        ] = await Promise.allSettled([
          alertsAPI.getAll({ limit: limit * 3, page: 1 }), // Fetch extra for sorting
          facebookAPI.getAlerts({ limit: limit * 3, page: 1 }),
          youtubeAPI.getAllVideos({ limit: limit * 3, page: 1 }),
          instagramAPI.getAlerts({ limit: limit * 3, page: 1 }),
          tiktokAPI.getAlerts({ limit: limit * 3, page: 1 }),
        ]);

        let allAlerts = [];

        // Process Twitter alerts
        if (
          twitterResponse.status === "fulfilled" &&
          twitterResponse.value?.alerts
        ) {
          const twitterAlerts = twitterResponse.value.alerts.map((alert) => ({
            _id: alert._id,
            platform: "twitter",
            username: alert.username,
            displayName: alert.displayName || alert.username,
            profileImage: alert.profileImage,
            content: alert.content,
            activityType: alert.activityType,
            media: alert.media || [],
            createdAt:
              alert.createdAt ||
              alert.tweetCreatedAt ||
              new Date().toISOString(),
            isViewed:
              typeof alert.isViewed === "boolean"
                ? alert.isViewed
                : !!alert.isRead,
            isRead: alert.isRead,
            sourceUrl: alert.sourceUrl || alert.tweetUrl,
            externalId: alert.externalId || alert.tweetId,
          }));
          allAlerts.push(...twitterAlerts);
        }

        // Process Facebook alerts
        if (
          facebookResponse.status === "fulfilled" &&
          facebookResponse.value?.alerts
        ) {
          const facebookAlerts = facebookResponse.value.alerts.map((alert) => ({
            _id: alert._id,
            platform: "facebook",
            username: alert.authorUsername || alert.source,
            displayName:
              alert.authorDisplayName || alert.authorUsername || alert.source,
            profileImage:
              alert.authorProfilePic || alert.profileImage || alert.profilePic,
            content: alert.content,
            activityType: alert.postType
              ? alert.postType.toLowerCase()
              : "post",
            media: alert.media || [],
            createdAt: alert.createdAt || new Date().toISOString(),
            isViewed: !!alert.isRead,
            isRead: alert.isRead,
            sourceUrl: alert.url,
            externalId: alert.postId,
          }));
          allAlerts.push(...facebookAlerts);
        }

        // Process YouTube alerts
        if (
          youtubeResponse.status === "fulfilled" &&
          youtubeResponse.value?.videos
        ) {
          const youtubeAlerts = youtubeResponse.value.videos.map((video) => ({
            _id: video._id,
            platform: "youtube",
            username: video.channelName,
            displayName: video.channelName,
            channelProfileImage:
              video.channelProfileImage || video.channelThumbnail,
            profileImage:
              video.channelProfileImage ||
              video.channelThumbnail ||
              video.thumbnail,
            content: video.videoTitle || video.title,
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
            createdAt:
              video.publishedAt || video.createdAt || new Date().toISOString(),
            isViewed: !!video.isRead,
            isRead: video.isRead,
            sourceUrl: `https://youtube.com/watch?v=${video.videoId}`,
            externalId: video.videoId,
          }));
          allAlerts.push(...youtubeAlerts);
        }

        // Process Instagram alerts
        if (
          instagramResponse.status === "fulfilled" &&
          instagramResponse.value?.alerts
        ) {
          const instagramAlerts = instagramResponse.value.alerts.map(
            (alert) => {
              const normalizedMedia = [];
              const pushMedia = (url, type = "image") => {
                if (!url) return;
                // Use URLs directly without proxying for Instagram CDN
                normalizedMedia.push({
                  type,
                  url: url,
                  previewUrl: url,
                });
              };

              if (Array.isArray(alert.media)) {
                alert.media.forEach((item) => {
                  pushMedia(
                    item?.url || item?.previewUrl,
                    item?.type || "image",
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

              if (alert.displayUrl) {
                pushMedia(
                  alert.displayUrl,
                  alert.postType?.toLowerCase() === "video" ? "video" : "image",
                );
              }

              const dedupedMedia = normalizedMedia.filter(
                (m, idx, arr) =>
                  m.url && arr.findIndex((x) => x.url === m.url) === idx,
              );

              return {
                _id: alert._id,
                platform: "instagram",
                username: alert.authorUsername || alert.source,
                displayName:
                  alert.authorDisplayName ||
                  alert.authorUsername ||
                  alert.source,
                profileImage: alert.profileImage || alert.authorAvatar || "",
                content: alert.content || alert.caption,
                activityType: alert.postType
                  ? String(alert.postType).toLowerCase()
                  : "post",
                media: dedupedMedia,
                createdAt:
                  alert.createdAt ||
                  alert.timestamp ||
                  new Date().toISOString(),
                isViewed: !!alert.isRead,
                isRead: alert.isRead,
                sourceUrl: alert.url || alert.postUrl,
                externalId: alert.postId || alert.shortCode,
              };
            },
          );
          allAlerts.push(...instagramAlerts);
        }

        // Process TikTok alerts
        if (
          tiktokResponse.status === "fulfilled" &&
          tiktokResponse.value?.alerts
        ) {
          const tiktokAlerts = tiktokResponse.value.alerts.map((alert) => ({
            _id: alert._id,
            platform: "tiktok",
            username: alert.authorUsername || alert.source,
            displayName:
              alert.authorDisplayName || alert.authorUsername || alert.source,
            profileImage: alert.authorProfilePic || alert.profileImage,
            content: alert.content,
            activityType: alert.postType
              ? String(alert.postType).toLowerCase()
              : "post",
            media: (() => {
              const items = [];
              if (Array.isArray(alert.images) && alert.images.length > 0) {
                alert.images.forEach((url) => {
                  const proxied = getProxiedImageUrl(url);
                  if (proxied)
                    items.push({
                      type: "image",
                      url: proxied,
                      previewUrl: proxied,
                    });
                });
              } else if (alert.displayUrl) {
                const proxied = getProxiedImageUrl(alert.displayUrl);
                if (proxied)
                  items.push({
                    type: alert.videoUrl ? "video" : "image",
                    url: proxied,
                    previewUrl: proxied,
                  });
              }
              return items;
            })(),
            createdAt:
              alert.createdAt || alert.timestamp || new Date().toISOString(),
            isViewed: !!alert.isRead,
            isRead: alert.isRead,
            sourceUrl: alert.url,
            externalId: alert.postId,
          }));
          allAlerts.push(...tiktokAlerts);
        }

        // Sort by timestamp (latest first)
        allAlerts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // Slice to requested limit
        const startIdx = (page - 1) * limit;
        const paginatedAlerts = allAlerts.slice(startIdx, startIdx + limit);

        return {
          alerts: paginatedAlerts,
          pagination: {
            total: allAlerts.length,
            hasMore: startIdx + limit < allAlerts.length,
            limit,
            page,
          },
        };
      } catch (error) {
        console.error("Error fetching combined alerts:", error);
        throw error;
      }
    },
    enabled,
    keepPreviousData: true,
    staleTime: 1000 * 5,
    refetchOnMount: false,
  });
};
