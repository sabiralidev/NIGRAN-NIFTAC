import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facebookAPI } from "../../services/api";
import toast from "react-hot-toast";

/**
 * Fetch Facebook alerts with pagination
 */
export const useFacebookAlerts = (params = {}) => {
  return useQuery({
    queryKey: ["facebookAlerts", params],
    queryFn: () => facebookAPI.getAlerts(params),
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to refetch on mount
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Mark all Facebook alerts as read
 */
export const useMarkAllFacebookAlertsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => facebookAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebookAlerts"] });
      toast.success("All alerts marked as read");
    },
    onError: (error) => toast.error(error.message),
  });
};

/**
 * Mark single Facebook alert as viewed
 */
export const useMarkFacebookAlertViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      facebookAPI.markViewed ? facebookAPI.markViewed(id) : Promise.resolve(),
    onSuccess: (_, id) => {
      // Invalidate all facebookAlerts queries (with or without params)
      queryClient.invalidateQueries({
        queryKey: ["facebookAlerts"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
  });
};
