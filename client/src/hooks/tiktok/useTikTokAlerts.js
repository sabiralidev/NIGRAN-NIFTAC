import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tiktokAPI } from "../../services/api";
import toast from "react-hot-toast";

export const useTikTokAlerts = (params = {}) => {
  return useQuery({
    queryKey: ["tiktokAlerts", params],
    queryFn: () => tiktokAPI.getAlerts(params),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
  });
};

export const useMarkAllTikTokAlertsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tiktokAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tiktokAlerts"] });
      toast.success("All alerts marked as read");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useMarkTikTokAlertViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      tiktokAPI.markViewed ? tiktokAPI.markViewed(id) : Promise.resolve(),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tiktokAlerts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
    },
  });
};

