import { useQuery } from "@tanstack/react-query";
import {
  alertsAPI,
  facebookAPI,
  youtubeAPI,
  instagramAPI,
  tiktokAPI,
} from "../services/api";

/**
 * Fetch unread alert counts from all supported platforms
 * Returns combined total count
 */
export const useUnreadCountAll = () => {
  return useQuery({
    queryKey: ["unreadCountAll"],
    queryFn: async () => {
      try {
        // Fetch unread counts from all platforms in parallel
        const [
          twitterResponse,
          facebookResponse,
          youtubeResponse,
          instagramResponse,
          tiktokResponse,
        ] = await Promise.allSettled([
          alertsAPI.getUnreadCount(),
          facebookAPI.getAlerts({ limit: 1000, page: 1 }), // Fetch all to count unread
          youtubeAPI.getAllVideos({ limit: 1000, page: 1 }), // Fetch all to count unread
          instagramAPI.getAlerts({ limit: 1000, page: 1 }),
          tiktokAPI.getAlerts({ limit: 1000, page: 1 }),
        ]);

        let twitterUnread = 0;
        let facebookUnread = 0;
        let youtubeUnread = 0;
        let instagramUnread = 0;
        let tiktokUnread = 0;

        // Extract Twitter unread count from unread-count endpoint
        if (twitterResponse.status === "fulfilled") {
          twitterUnread = twitterResponse.value?.count || 0;
        }

        // Count unviewed/unread Facebook alerts
        if (facebookResponse.status === "fulfilled" && facebookResponse.value?.alerts) {
          facebookUnread = facebookResponse.value.alerts.filter(
            (alert) => !alert.isRead
          ).length;
        }

        // Count unread YouTube videos
        if (youtubeResponse.status === "fulfilled" && youtubeResponse.value?.videos) {
          youtubeUnread = youtubeResponse.value.videos.filter(
            (video) => !video.isRead
          ).length;
        }

        // Count unread Instagram alerts
        if (instagramResponse.status === "fulfilled" && instagramResponse.value?.alerts) {
          instagramUnread = instagramResponse.value.alerts.filter(
            (alert) => !alert.isRead
          ).length;
        }

        // Count unread TikTok alerts
        if (tiktokResponse.status === "fulfilled" && tiktokResponse.value?.alerts) {
          tiktokUnread = tiktokResponse.value.alerts.filter(
            (alert) => !alert.isRead
          ).length;
        }

        const totalUnread =
          twitterUnread +
          facebookUnread +
          youtubeUnread +
          instagramUnread +
          tiktokUnread;

        return {
          count: totalUnread,
          twitter: twitterUnread,
          facebook: facebookUnread,
          youtube: youtubeUnread,
          instagram: instagramUnread,
          tiktok: tiktokUnread,
        };
      } catch (error) {
        console.error("Error fetching combined unread counts:", error);
        return {
          count: 0,
          twitter: 0,
          facebook: 0,
          youtube: 0,
          instagram: 0,
          tiktok: 0,
        };
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
};
