import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardAPI, instagramAPI, tiktokAPI, alertsAPI, facebookAPI, youtubeAPI } from '../services/api'
import toast from 'react-hot-toast'
import { getProxiedImageUrl } from '../utils/imageProxy'

export const useDashboardStats = (platform = 'all', days = 7) => {
  return useQuery({
    queryKey: ['dashboardStats', platform, days],
    queryFn: () => dashboardAPI.getStats(platform, days),
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export const useDashboardMentions = (platform = 'twitter', limit = 10) => {
  return useQuery({
    queryKey: ['dashboardMentions', platform, limit],
    queryFn: () => dashboardAPI.getMentions(platform, limit),
    refetchInterval: 20000,
    staleTime: 10000,
  })
}

export const useDashboardTimeline = (platform = 'twitter', days = 7) => {
  return useQuery({
    queryKey: ['dashboardTimeline', platform, days],
    queryFn: () => dashboardAPI.getTimeline(platform, days),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export const usePlatformAccounts = (platform = 'twitter') => {
  return useQuery({
    queryKey: ['platformAccounts', platform],
    queryFn: () => dashboardAPI.getAccounts(platform),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export const useKeywords = () => {
  return useQuery({
    queryKey: ['keywords'],
    queryFn: async () => {
      const response = await dashboardAPI.getKeywords()
      if (Array.isArray(response)) return { keywords: response }
      if (Array.isArray(response?.keywords)) return response
      if (Array.isArray(response?.data)) return { keywords: response.data }
      return { keywords: [] }
    },
    staleTime: 60000,
  })
}

export const useAddKeyword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (word) => dashboardAPI.addKeyword(word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      toast.success('Keyword added')
    },
    onError: (err) => toast.error(err.message),
  })
}

export const useRemoveKeyword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => dashboardAPI.removeKeyword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
    },
    onError: (err) => toast.error(err.message),
  })
}

// Combined data from all platforms (Twitter, Facebook, YouTube, Instagram) for "All" platform view
export const useCombinedPlatformStats = (days = 7) => {
  return useQuery({
    queryKey: ['combinedStats', days],
    queryFn: async () => {
      // Parallel fetch from all platform sources
      const [
        twitterStats,
        twitterMentionsResponse,
        facebookResponse,
        youtubeResponse,
        instagramStatsResponse,
        instagramMentionsResponse,
        tiktokAlertsResponse,
        twitterAccountsData,
        facebookAccountsData,
        youtubeChannels,
        instagramAccountsResponse,
        tiktokAccountsResponse,
      ] = await Promise.all([
        dashboardAPI.getStats('twitter', days).catch(() => ({ stats: {} })),
        dashboardAPI.getMentions('twitter', 1000).catch(() => ({ mentions: [] })),
        dashboardAPI.facebookGetAlerts().catch(() => ([])),
        dashboardAPI.youtubeGetVideos?.().catch(() => ([])) || Promise.resolve([]),
        instagramAPI.getDashboardStats(days).catch(() => ({ stats: {} })),
        instagramAPI.getDashboardMentions(1000).catch(() => ({ mentions: [] })),
        tiktokAPI.getAlerts({ limit: 1000, page: 1, sort: 'newest' }).catch(() => ({ alerts: [], pagination: { total: 0 } })),
        dashboardAPI.getAccounts('twitter').catch(() => ({ accounts: [] })),
        dashboardAPI.facebookGetAccounts().catch(() => ({ accounts: [] })),
        dashboardAPI.youtubeGetChannels?.().catch(() => ([])) || Promise.resolve([]),
        instagramAPI.getDashboardAccounts().catch(() => ({ accounts: [] })),
        tiktokAPI.getAccounts().catch(() => ([])),
      ]);

      const twitterData = twitterStats.stats || {};
      const twitterMentions = Array.isArray(twitterMentionsResponse?.mentions)
        ? twitterMentionsResponse.mentions
        : [];
      
      // ==================== FACEBOOK TRANSFORMATION ====================
      let facebookAlerts = [];
      if (Array.isArray(facebookResponse)) {
        facebookAlerts = facebookResponse;
      } else if (facebookResponse?.data && Array.isArray(facebookResponse.data)) {
        facebookAlerts = facebookResponse.data;
      } else if (facebookResponse?.alerts && Array.isArray(facebookResponse.alerts)) {
        facebookAlerts = facebookResponse.alerts;
      }

      const transformedFacebookPosts = facebookAlerts.map((alert) => {
        const content = alert.content || alert.message || alert.text || '';
        
        let media = [];
        if (Array.isArray(alert.media)) {
          media = alert.media.map((mediaItem) => {
            let imageUrl = null;
            let imageType = 'image';
            let previewUrl = null;

            if (mediaItem.photo_image?.url) {
              imageUrl = mediaItem.photo_image.url;
              previewUrl = mediaItem.thumbnail || mediaItem.photo_image.url;
            } else if (mediaItem.photo_image?.url1) {
              imageUrl = mediaItem.photo_image.url1;
              previewUrl = mediaItem.thumbnail || mediaItem.photo_image.url1;
            } else if (mediaItem.thumbnail) {
              imageUrl = mediaItem.thumbnail;
              previewUrl = mediaItem.thumbnail;
            } else if (mediaItem.url) {
              imageUrl = mediaItem.url;
              previewUrl = mediaItem.previewUrl || mediaItem.url;
            } else if (mediaItem.src) {
              imageUrl = mediaItem.src;
              previewUrl = mediaItem.previewUrl || mediaItem.src;
            }

            if (mediaItem.__typename) {
              imageType = mediaItem.__typename === 'Photo' ? 'image' : mediaItem.__typename;
            } else if (mediaItem.type) {
              imageType = mediaItem.type;
            }

            return { url: imageUrl, previewUrl, type: imageType };
          }).filter((m) => m.url);
        }

        const authorUsername = alert.authorUsername || alert.source || 'Unknown';
        const authorDisplayName = alert.authorDisplayName || alert.authorUsername || alert.source || 'Unknown';

        return {
          _id: alert._id || `fb_${Date.now()}_${Math.random()}`,
          platform: 'facebook',
          authorUsername,
          authorDisplayName,
          authorAvatar: alert.authorProfilePic || alert.profilePic || '',
          content,
          postUrl: alert.url || '#',
          postType: alert.postType || (media.length > 0 ? 'image' : 'text'),
          media,
          createdAt: alert.createdAt || alert.timestamp || new Date().toISOString(),
          isRead: Boolean(alert.isRead),
          isViewed: typeof alert.isViewed === 'boolean' ? alert.isViewed : Boolean(alert.isRead),
          metrics: { likes: alert.likes || 0, shares: alert.shares || 0, comments: alert.comments || 0 }
        };
      });

      // ==================== YOUTUBE TRANSFORMATION ====================
      let youtubeVideos = [];
      if (Array.isArray(youtubeResponse)) {
        youtubeVideos = youtubeResponse;
      } else if (youtubeResponse?.data && Array.isArray(youtubeResponse.data)) {
        youtubeVideos = youtubeResponse.data;
      } else if (youtubeResponse?.videos && Array.isArray(youtubeResponse.videos)) {
        youtubeVideos = youtubeResponse.videos;
      }

      const transformedYoutubeVideos = youtubeVideos.map((video) => {
        const channelName = video.channelName || video.channelTitle || 'Unknown Channel';
        const videoTitle = video.title || video.videoTitle || 'Unknown Video';
        const description = video.description || '';

        return {
          _id: video._id || video.videoId || `yt_${Date.now()}_${Math.random()}`,
          platform: 'youtube',
          authorUsername: channelName,
          authorDisplayName: channelName,
          authorAvatar: video.channelThumbnail || video.channelProfileImage || '',
          content: description || videoTitle,
          postUrl: `https://youtube.com/watch?v=${video.videoId}` || '#',
          postType: 'VIDEO',
          media: video.thumbnail ? [{ url: video.thumbnail, previewUrl: video.thumbnail, type: 'video' }] : [],
          createdAt: video.publishedAt || video.createdAt || new Date().toISOString(),
          isRead: Boolean(video.isRead),
          isViewed: typeof video.isViewed === 'boolean' ? video.isViewed : Boolean(video.isRead),
          metrics: {
            likes: video.likeCount || 0,
            shares: 0,
            comments: video.commentCount || 0,
          }
        };
      });

      // ==================== INSTAGRAM TRANSFORMATION ====================
      const instagramStats = instagramStatsResponse?.stats || {};
      const instagramMentions = Array.isArray(instagramMentionsResponse?.mentions)
        ? instagramMentionsResponse.mentions
        : [];

      const transformedInstagramPosts = instagramMentions.map((post) => {
        const content = post.content || post.caption || '';
        const media = Array.isArray(post.media)
          ? post.media
              .map((item) => ({
                url: item?.url || '',
                previewUrl: item?.previewUrl || '',
                type: item?.type || 'image',
                useVideoPreview: Boolean(item?.useVideoPreview),
                videoSrc: item?.videoSrc,
              }))
              .filter(
                (m) =>
                  m.previewUrl ||
                  m.url ||
                  m.useVideoPreview,
              )
          : [];

        return {
          _id: post._id || `ig_${Date.now()}_${Math.random()}`,
          platform: 'instagram',
          authorUsername: post.authorUsername || post.source || 'Unknown',
          authorDisplayName:
            post.authorDisplayName || post.authorUsername || post.source || 'Unknown',
          authorAvatar: post.authorAvatar || post.profileImage || '',
          content,
          postUrl: post.postUrl || post.url || '#',
          postType: (post.postType || 'IMAGE').toUpperCase(),
          media,
          createdAt: post.createdAt || post.timestamp || new Date().toISOString(),
          isRead: Boolean(post.isRead),
          isViewed: typeof post.isViewed === 'boolean' ? post.isViewed : Boolean(post.isRead),
          metrics: {
            likes: post.metrics?.likes || post.likesCount || 0,
            shares: 0,
            comments: post.metrics?.comments || post.commentsCount || 0,
          },
        };
      });

      // ==================== TIKTOK TRANSFORMATION ====================
      const tiktokAlerts = Array.isArray(tiktokAlertsResponse?.alerts)
        ? tiktokAlertsResponse.alerts
        : [];
      const transformedTikTokPosts = tiktokAlerts.map((alert) => {
        const content = alert.content || '';
        const postType = String(alert.postType || 'VIDEO').toUpperCase();

        const media = [];
        if (postType === 'CAROUSEL' && Array.isArray(alert.images)) {
          alert.images.forEach((url) => {
            const proxied = getProxiedImageUrl(url, 'image');
            if (proxied) media.push({ url: proxied, previewUrl: proxied, type: 'image' });
          });
        } else if (alert.displayUrl) {
          const proxied = getProxiedImageUrl(alert.displayUrl, 'image');
          if (proxied) {
            media.push({
              url: proxied,
              previewUrl: proxied,
              type: postType === 'VIDEO' ? 'video' : 'image',
              videoSrc: alert.videoUrl ? getProxiedImageUrl(alert.videoUrl, 'video') : undefined,
            });
          }
        }

        return {
          _id: alert._id || `tt_${Date.now()}_${Math.random()}`,
          platform: 'tiktok',
          authorUsername: alert.authorUsername || alert.source || 'Unknown',
          authorDisplayName:
            alert.authorDisplayName || alert.authorUsername || alert.source || 'Unknown',
          authorAvatar: alert.authorProfilePic || alert.profileImage || '',
          content,
          postUrl: alert.url || '#',
          postType,
          media,
          createdAt: alert.createdAt || alert.timestamp || new Date().toISOString(),
          isRead: Boolean(alert.isRead),
          isViewed: typeof alert.isViewed === 'boolean' ? alert.isViewed : Boolean(alert.isRead),
          metrics: {
            likes: alert.likesCount || 0,
            shares: alert.sharesCount || 0,
            comments: alert.commentsCount || 0,
          },
        };
      });

      // ==================== TWITTER FORMATTING ====================
      const normalizedTwitterMentions = (twitterMentions.length > 0
        ? twitterMentions
        : twitterData.recentMentions || []).map((m) => ({
        ...m,
        metrics: m.metrics || { likes: 0, shares: 0, comments: 0 }
      }));

      // ==================== POSTS AGGREGATION WITH PRIORITY ====================
      // Get exactly 2 latest posts from each platform for balanced visibility
      const getLatest2Posts = (posts) => {
        return posts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);
      };

      const twitterLatest2 = getLatest2Posts(normalizedTwitterMentions);
      const facebookLatest2 = getLatest2Posts(transformedFacebookPosts);
      const youtubeLatest2 = getLatest2Posts(transformedYoutubeVideos);
      const instagramLatest2 = getLatest2Posts(transformedInstagramPosts);
      const tiktokLatest2 = getLatest2Posts(transformedTikTokPosts);

      // Combine all latest posts from all platforms and sort chronologically (newest first)
      const allLatestPosts = [
        ...twitterLatest2,
        ...facebookLatest2,
        ...youtubeLatest2,
        ...instagramLatest2,
        ...tiktokLatest2,
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Get all posts merged and sorted chronologically for full list
      const allMergedPosts = [
        ...normalizedTwitterMentions,
        ...transformedFacebookPosts,
        ...transformedYoutubeVideos,
        ...transformedInstagramPosts,
        ...transformedTikTokPosts,
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // ==================== COUNTS & AGGREGATION ====================
      // Prefer authoritative twitter total from stats if available, otherwise fall back to mentions array length
      const twitterCount = typeof twitterData.mentions === 'number'
        ? twitterData.mentions
        : (Array.isArray(normalizedTwitterMentions) ? normalizedTwitterMentions.length : 0);
      const facebookCount = facebookAlerts.length;
      const youtubeCount = youtubeVideos.length;
      const instagramCount =
        instagramStats.mentions || transformedInstagramPosts.length || 0;
      const tiktokCount =
        tiktokAlertsResponse?.pagination?.total ?? transformedTikTokPosts.length;
      // Fetch authoritative counts from each platform's API where available,
      // then sum them to get a true total across all platform databases.
      let facebookTotal = 0;
      let youtubeTotal = 0;
      try {
        const fbResp = await facebookAPI.getAlerts({ page: 1, limit: 1 }).catch(() => ({ pagination: { total: 0 } }));
        facebookTotal = fbResp?.pagination?.total ?? facebookCount;
      } catch (e) {
        facebookTotal = facebookCount;
      }

      try {
        // Prefer video stats endpoint which returns totalVideos
        const ytStats = await youtubeAPI.getVideoStats().catch(() => ({ stats: { totalVideos: youtubeCount } }));
        youtubeTotal = ytStats?.stats?.totalVideos ?? youtubeCount;
      } catch (e) {
        youtubeTotal = youtubeCount;
      }

      const computedSum = twitterCount + (facebookTotal || facebookCount) + (youtubeTotal || youtubeCount) + instagramCount + tiktokCount;

      // Use computed sum as the authoritative total. If main alerts API returns a global total, prefer it only if larger (avoid undercounting).
      let totalAlerts = computedSum;
      try {
        const globalResp = await alertsAPI.getStats().catch(() => null);
        const globalTotal = globalResp?.stats?.totalAlerts ?? globalResp?.stats?.total ?? globalResp?.total;
        if (typeof globalTotal === 'number' && globalTotal > totalAlerts) {
          totalAlerts = globalTotal;
        }
      } catch (err) {
        // ignore
      }

      const twitterEngagement = twitterData.engagement || 0;
      const facebookEngagement = transformedFacebookPosts.reduce(
        (sum, post) => sum + (post.metrics?.likes || 0) + (post.metrics?.shares || 0) + (post.metrics?.comments || 0),
        0
      );
      const youtubeEngagement = transformedYoutubeVideos.reduce(
        (sum, video) => sum + (video.metrics?.likes || 0) + (video.metrics?.comments || 0),
        0
      );
      const instagramEngagement =
        instagramStats.engagement ||
        transformedInstagramPosts.reduce(
          (sum, post) =>
            sum +
            (post.metrics?.likes || 0) +
            (post.metrics?.shares || 0) +
            (post.metrics?.comments || 0),
          0
        );
      const tiktokEngagement = transformedTikTokPosts.reduce(
        (sum, post) =>
          sum +
          (post.metrics?.likes || 0) +
          (post.metrics?.shares || 0) +
          (post.metrics?.comments || 0),
        0
      );
      const totalEngagement =
        twitterEngagement +
        facebookEngagement +
        youtubeEngagement +
        instagramEngagement +
        tiktokEngagement;

      // ==================== ACCOUNTS AGGREGATION ====================
      let twitterAccountsArray = [];
      if (twitterAccountsData?.accounts && Array.isArray(twitterAccountsData.accounts)) {
        twitterAccountsArray = twitterAccountsData.accounts;
      }
      
      let facebookAccountsArray = [];
      if (Array.isArray(facebookAccountsData)) {
        facebookAccountsArray = facebookAccountsData;
      } else if (facebookAccountsData?.accounts && Array.isArray(facebookAccountsData.accounts)) {
        facebookAccountsArray = facebookAccountsData.accounts;
      }

      let youtubeAccountsArray = [];
      if (Array.isArray(youtubeChannels)) {
        youtubeAccountsArray = youtubeChannels;
      } else if (youtubeChannels?.channels && Array.isArray(youtubeChannels.channels)) {
        youtubeAccountsArray = youtubeChannels.channels;
      } else if (youtubeChannels?.data && Array.isArray(youtubeChannels.data)) {
        youtubeAccountsArray = youtubeChannels.data;
      }

      let instagramAccountsArray = [];
      if (Array.isArray(instagramAccountsResponse)) {
        instagramAccountsArray = instagramAccountsResponse;
      } else if (
        instagramAccountsResponse?.accounts &&
        Array.isArray(instagramAccountsResponse.accounts)
      ) {
        instagramAccountsArray = instagramAccountsResponse.accounts;
      }

      let tiktokAccountsArray = [];
      if (Array.isArray(tiktokAccountsResponse)) {
        tiktokAccountsArray = tiktokAccountsResponse;
      } else if (tiktokAccountsResponse?.accounts && Array.isArray(tiktokAccountsResponse.accounts)) {
        tiktokAccountsArray = tiktokAccountsResponse.accounts;
      }

      const twitterAccounts = twitterAccountsArray.map(acc => ({ ...acc, platform: 'twitter' }));
      const facebookAccounts = facebookAccountsArray.map(acc => ({ ...acc, platform: 'facebook' }));
      const youtubeAccounts = youtubeAccountsArray.map(acc => ({ ...acc, platform: 'youtube' }));
      const instagramAccounts = instagramAccountsArray.map(acc => ({ ...acc, platform: 'instagram' }));
      const tiktokAccounts = tiktokAccountsArray.map(acc => ({ ...acc, platform: 'tiktok' }));

      // Interleave accounts from all platforms for balanced display
      const interleavePlatforms = (arr1, arr2, arr3, arr4, arr5) => {
        const result = [];
        const maxLength = Math.max(arr1.length, arr2.length, arr3.length, arr4.length, arr5.length);
        
        for (let i = 0; i < maxLength; i++) {
          if (i < arr1.length) result.push(arr1[i]);
          if (i < arr2.length) result.push(arr2[i]);
          if (i < arr3.length) result.push(arr3[i]);
          if (i < arr4.length) result.push(arr4[i]);
          if (i < arr5.length) result.push(arr5[i]);
        }
        
        return result;
      };

      const allAccounts = interleavePlatforms(
        twitterAccounts,
        facebookAccounts,
        youtubeAccounts,
        instagramAccounts,
        tiktokAccounts
      );

      // ==================== SOURCES VISUALIZATION ====================
      const sources = [
        { name: 'Twitter', value: Math.max(1, twitterCount), color: '#1DA1F2' },
        { name: 'Facebook', value: Math.max(1, facebookTotal || facebookCount), color: '#1877F2' },
        { name: 'YouTube', value: Math.max(1, youtubeTotal || youtubeCount), color: '#FF0000' },
        { name: 'Instagram', value: Math.max(1, instagramCount), color: '#E1306C' },
        { name: 'TikTok', value: Math.max(1, tiktokCount), color: '#000000' },
      ];

      return {
        // Totals
        mentions: totalAlerts,
        engagement: totalEngagement,
        
        // Recent posts - 2 from each platform, sorted by latest first
        recentMentions: allLatestPosts.slice(0, 8),
        allMentions: allMergedPosts,
        
        // Accounts
        accounts: allAccounts,
        
        // Sources
        sources,
        
        // Platform details for sentiment and other stats
        twitterData,
        facebookData: transformedFacebookPosts,
        youtubeData: transformedYoutubeVideos,
        instagramData: transformedInstagramPosts,
        tiktokData: transformedTikTokPosts,
        
        // Platform counts for debugging
        platformCounts: {
          twitter: twitterCount,
          facebook: facebookTotal || facebookCount,
          youtube: youtubeTotal || youtubeCount,
          instagram: instagramCount,
          tiktok: tiktokCount,
        }
      };
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
};
