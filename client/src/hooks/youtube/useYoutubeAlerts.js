import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { youtubeAPI } from "../../services/api";
import toast from "react-hot-toast";

/**
 * Fetch YouTube videos/alerts with pagination
 */
export const useYoutubeAlerts = (params = {}) => {
  return useQuery({
    queryKey: ["youtubeAlerts", params],
    queryFn: () => youtubeAPI.getAllVideos(params),
    keepPreviousData: true,
    staleTime: 0, // Always consider data stale to refetch on mount
    refetchOnMount: true, // Refetch when component mounts
  });
};

/**
 * Mark all YouTube videos as viewed
 */
export const useMarkAllYoutubeVideosAsViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => youtubeAPI.markAllVideosAsViewed(),
    onSuccess: () => {
      // Invalidate all youtubeAlerts queries (with or without params)
      queryClient.invalidateQueries({
        queryKey: ["youtubeAlerts"],
        exact: false,
      });
      toast.success("All videos marked as viewed");
    },
    onError: (error) => toast.error(error.message),
  });
};

/**
 * Mark single YouTube video as viewed
 */
export const useMarkYoutubeVideoAsViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      youtubeAPI.markVideoAsViewed
        ? youtubeAPI.markVideoAsViewed(id)
        : Promise.resolve(),
    onSuccess: (_, id) => {
      // Invalidate all youtubeAlerts queries (with or without params)
      queryClient.invalidateQueries({
        queryKey: ["youtubeAlerts"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
  });
};
