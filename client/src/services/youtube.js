import { youtubeAPI } from './api'

/**
 * YouTube Service
 * Handles all YouTube-related API calls and data management
 */

export const youtubeService = {
  // Channel Management
  addChannel: async (channelId) => {
    try {
      const response = await youtubeAPI.addChannel({ channelId })
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to add YouTube channel')
    }
  },

  getChannels: async () => {
    try {
      const response = await youtubeAPI.getChannels()
      return Array.isArray(response) ? response : []
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch YouTube channels')
    }
  },

  getChannel: async (channelId) => {
    try {
      const response = await youtubeAPI.getChannel(channelId)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch channel details')
    }
  },

  removeChannel: async (channelId) => {
    try {
      const response = await youtubeAPI.removeChannel(channelId)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to remove channel')
    }
  },

  updateChannelStatus: async (channelId, status) => {
    try {
      const response = await youtubeAPI.updateChannelStatus(channelId, status)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to update channel status')
    }
  },

  // Video Management
  getAllVideos: async (page = 1, limit = 20) => {
    try {
      const response = await youtubeAPI.getAllVideos({ page, limit })
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch videos')
    }
  },

  getVideosByChannel: async (channelId, page = 1, limit = 20) => {
    try {
      const response = await youtubeAPI.getVideosByChannel(channelId, { page, limit })
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch channel videos')
    }
  },

  getVideo: async (videoId) => {
    try {
      const response = await youtubeAPI.getVideo(videoId)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch video')
    }
  },

  markVideoAsViewed: async (videoId) => {
    try {
      const response = await youtubeAPI.markVideoAsViewed(videoId)
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to mark video as viewed')
    }
  },

  getVideoStats: async () => {
    try {
      const response = await youtubeAPI.getVideoStats()
      return response
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch statistics')
    }
  },
}

export default youtubeService
