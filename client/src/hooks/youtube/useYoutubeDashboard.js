import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const youtubeApi = axios.create({
  baseURL: 'http://' + location.hostname + ':5002/youtube',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for YouTube API
youtubeApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.msg || error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

/**
 * Fetch YouTube dashboard stats
 * Returns: { stats with videos, engagement, channels, sentiment, etc. }
 */
export const useYoutubeStats = (days = 7) => {
  return useQuery({
    queryKey: ['youtubeStats', days],
    queryFn: async () => {
      try {
        const response = await youtubeApi.get('/dashboard/stats', { params: { days } })
        return {
          ...response,
          stats: response?.stats || {},
          success: true,
        }
      } catch (error) {
        console.error('Error fetching YouTube stats:', error)
        return {
          stats: {},
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
 * Fetch YouTube channels (monitored accounts)
 * Returns: { accounts }
 */
export const useYoutubeAccounts = () => {
  return useQuery({
    queryKey: ['youtubeAccounts'],
    queryFn: async () => {
      try {
        const response = await youtubeApi.get('/dashboard/accounts')
        // Response can be an array directly or an object with accounts property
        const accounts = Array.isArray(response) ? response : (response?.accounts || [])

        return {
          accounts,
          success: true,
        }
      } catch (error) {
        console.error('Error fetching YouTube accounts:', error)
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
 * Fetch YouTube alerts (recent videos)
 * Returns: { alerts, recentAlerts }
 */
export const useYoutubeAlerts = (limit = 10) => {
  return useQuery({
    queryKey: ['youtubeAlerts', limit],
    queryFn: async () => {
      try {
        const response = await youtubeApi.get('/dashboard/mentions', { params: { limit } })
        const alerts = response?.mentions || []

        return {
          alerts,
          recentAlerts: alerts.slice(0, Math.min(limit, 10)),
          success: true,
        }
      } catch (error) {
        console.error('Error fetching YouTube alerts:', error)
        return {
          alerts: [],
          recentAlerts: [],
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 20000, // Refetch every 20 seconds
    staleTime: 10000, // Data is fresh for 10 seconds
  })
}

/**
 * Fetch YouTube timeline data
 * Returns: { timeline }
 */
export const useYoutubeTimeline = (days = 7) => {
  return useQuery({
    queryKey: ['youtubeTimeline', days],
    queryFn: async () => {
      try {
        const response = await youtubeApi.get('/dashboard/timeline', { params: { days } })
        return {
          timeline: response?.timeline || [],
          success: true,
        }
      } catch (error) {
        console.error('Error fetching YouTube timeline:', error)
        return {
          timeline: [],
          success: false,
          error: error.message,
        }
      }
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Data is fresh for 30 seconds
  })
}
