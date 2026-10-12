import { useQuery } from "@tanstack/react-query";
import { instagramAPI } from "../../services/api";

export const useInstagramStats = (days = 7) => {
  return useQuery({
    queryKey: ["instagramStats", days],
    queryFn: async () => {
      try {
        const response = await instagramAPI.getDashboardStats(days);
        return {
          ...response,
          stats: response?.stats || {},
          success: true,
        };
      } catch (error) {
        console.error("Error fetching Instagram stats:", error);
        return {
          stats: {},
          success: false,
          error: error.message,
        };
      }
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });
};

export const useInstagramAlerts = (limit = 10) => {
  return useQuery({
    queryKey: ["instagramAlerts", limit],
    queryFn: async () => {
      try {
        const response = await instagramAPI.getDashboardMentions(limit);
        const mentions = response?.mentions || [];

        return {
          alerts: mentions,
          recentAlerts: mentions.slice(0, Math.min(limit, 10)),
          success: true,
        };
      } catch (error) {
        console.error("Error fetching Instagram alerts:", error);
        return {
          alerts: [],
          recentAlerts: [],
          success: false,
          error: error.message,
        };
      }
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });
};

export const useInstagramTimeline = (days = 7) => {
  return useQuery({
    queryKey: ["instagramTimeline", days],
    queryFn: async () => {
      try {
        const response = await instagramAPI.getDashboardTimeline(days);
        return {
          timeline: response?.timeline || [],
          success: true,
        };
      } catch (error) {
        console.error("Error fetching Instagram timeline:", error);
        return {
          timeline: [],
          success: false,
          error: error.message,
        };
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

export const useInstagramAccounts = () => {
  return useQuery({
    queryKey: ["instagramAccounts"],
    queryFn: async () => {
      try {
        const response = await instagramAPI.getDashboardAccounts();
        return {
          accounts: response?.accounts || [],
          success: true,
        };
      } catch (error) {
        console.error("Error fetching Instagram accounts:", error);
        return {
          accounts: [],
          success: false,
          error: error.message,
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
};
