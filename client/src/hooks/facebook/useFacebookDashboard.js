import { useQuery } from '@tanstack/react-query'
import { facebookAPI } from '../../services/api'

/**
 * Fetch all Facebook alerts and calculate stats
 * Returns: { alerts, totalAlerts, totalEngagement, totalLikes, totalShares, totalComments }
 */
export const useFacebookStats = () => {
  return useQuery({
    queryKey: ['facebookStats'],
    queryFn: async () => {
      try {
        const response = await facebookAPI.getAlerts()
        // Response is already processed by interceptor, contains: success, alerts, pagination
        const alerts = response?.alerts || response?.data || []

        // Calculate aggregated stats from actual alert data
        const totalAlerts = response?.pagination?.total ?? alerts.length
        const totalLikes = alerts.reduce((sum, alert) => sum + (alert.likes || 0), 0)
        const totalShares = alerts.reduce((sum, alert) => sum + (alert.shares || 0), 0)
        const totalComments = alerts.reduce((sum, alert) => sum + (alert.comments || 0), 0)
        const totalEngagement = totalLikes + totalShares + totalComments

        // Calculate trend (mock for now - can be improved with historical data)
        const trend = totalAlerts > 0 ? '+12%' : '0%'

        return {
          alerts,
          totalAlerts,
          totalEngagement,
          totalLikes,
          totalShares,
          totalComments,
          trend,
          success: true,
        }
      } catch (error) {
        console.error('Error fetching Facebook stats:', error)
        return {
          alerts: [],
          totalAlerts: 0,
          totalEngagement: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          trend: '0%',
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time feel
    staleTime: 5000, // Data is fresh for 5 seconds
  })
}

/**
 * Fetch Facebook accounts (monitored accounts)
 * Returns: { accounts }
 */
export const useFacebookAccounts = () => {
  return useQuery({
    queryKey: ['facebookAccounts'],
    queryFn: async () => {
      try {
        const response = await facebookAPI.getAccounts()
        // Response is already processed by interceptor
        // It can be an array directly or an object with accounts property
        const accounts = Array.isArray(response) ? response : (response?.accounts || [])

        return {
          accounts,
          success: true,
        }
      } catch (error) {
        console.error('Error fetching Facebook accounts:', error)
        return {
          accounts: [],
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
  })
}

/**
 * Fetch Facebook alerts (recent posts/mentions)
 * Returns: { alerts, recentAlerts }
 */
export const useFacebookAlerts = (limit = 10) => {
  return useQuery({
    queryKey: ['facebookAlerts', limit],
    queryFn: async () => {
      try {
        const response = await facebookAPI.getAlerts()
        const alerts = response?.alerts || response?.data || []

        // Get recent alerts (sorted by timestamp, most recent first)
        const recentAlerts = alerts
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit)
          .map((alert) => {
            // Extract and format media from nested Apify structure
            let formattedMedia = [];
            
            if (alert.media && Array.isArray(alert.media)) {
              formattedMedia = alert.media.map((mediaItem) => {
                // Handle nested Apify Facebook structure
                let imageUrl = null;
                let imageType = 'image';
                let previewUrl = null;

                // Try different possible image URL locations in the nested structure
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
                  // Fallback to direct url property (for non-Apify format)
                  imageUrl = mediaItem.url;
                  previewUrl = mediaItem.previewUrl || mediaItem.url;
                } else if (typeof mediaItem === 'string') {
                  // Handle raw string URLs
                  imageUrl = mediaItem;
                  previewUrl = mediaItem;
                }

                // Extract type from __typename or type property
                if (mediaItem.__typename) {
                  imageType = mediaItem.__typename === 'Photo' ? 'image' : mediaItem.__typename;
                } else if (mediaItem.type) {
                  imageType = mediaItem.type;
                }

                return {
                  url: imageUrl,
                  previewUrl: previewUrl,
                  type: imageType,
                };
              }).filter((m) => m.url); // Remove any media without valid URL
            }

            return {
              ...alert,
              postUrl: alert.url || alert.feedback?.url,
              authorUsername: alert.authorUsername || alert.source || 'Unknown',
              authorDisplayName: alert.authorDisplayName || alert.authorUsername || alert.source || 'Unknown',
              authorAvatar: alert.authorProfilePic || alert.profilePic || '',
              platform: 'facebook',
              postType: alert.postType || (formattedMedia.length > 0 ? 'IMAGE' : 'TEXT'),
              media: formattedMedia,
            };
          })

        return {
          alerts,
          recentAlerts,
          success: true,
        }
      } catch (error) {
        console.error('Error fetching Facebook alerts:', error)
        return {
          alerts: [],
          recentAlerts: [],
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time feel
    staleTime: 5000, // Data is fresh for 5 seconds
  })
}

/**
 * Fetch timeline data (aggregated daily counts of alerts)
 * Returns: { timeline }
 */
export const useFacebookTimeline = (days = 7) => {
  return useQuery({
    queryKey: ['facebookTimeline', days],
    queryFn: async () => {
      try {
        const response = await facebookAPI.getAlerts()
        const alerts = response?.alerts || response?.data || []

        // Generate timeline data (group by date)
        const timelineMap = {}
        const now = new Date()
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        // Initialize timeline with zeros for each day
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split('T')[0]
          timelineMap[dateStr] = 0
        }

        // Count alerts per day
        alerts.forEach((alert) => {
          const alertDate = new Date(alert.timestamp).toISOString().split('T')[0]
          if (timelineMap.hasOwnProperty(alertDate)) {
            timelineMap[alertDate]++
          }
        })

        // Convert to array format for charts
        const timeline = Object.entries(timelineMap).map(([date, count]) => ({
          _id: date,
          count,
          date,
        }))

        return {
          timeline,
          success: true,
        }
      } catch (error) {
        console.error('Error fetching Facebook timeline:', error)
        return {
          timeline: [],
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds for real-time feel
    staleTime: 5000, // Data is fresh for 5 seconds
  })
}
