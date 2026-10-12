import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instagramAPI } from "../../services/api";
import toast from "react-hot-toast";

/**
 * Fetch Instagram alerts with pagination
 */
export const useInstagramAlerts = (params = {}) => {
  return useQuery({
    queryKey: ["instagramAlerts", params],
    queryFn: () => instagramAPI.getAlerts(params),
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to refetch on mount
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Mark all Instagram alerts as read
 */
export const useMarkAllInstagramAlertsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => instagramAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagramAlerts"] });
      toast.success("All alerts marked as read");
    },
    onError: (error) => toast.error(error.message),
  });
};

/**
 * Mark single Instagram alert as viewed
 */
export const useMarkInstagramAlertViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      instagramAPI.markViewed ? instagramAPI.markViewed(id) : Promise.resolve(),
    onSuccess: (_, id) => {
      // Invalidate all instagramAlerts queries (with or without params)
      queryClient.invalidateQueries({
        queryKey: ["instagramAlerts"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
  });
};
