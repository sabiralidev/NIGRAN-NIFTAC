import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  accountsAPI,
  facebookAPI,
  instagramAPI,
  tiktokAPI,
  youtubeAPI,
} from "../services/api";
import toast from "react-hot-toast";

export const useAccounts = (params = {}) => {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: () => accountsAPI.getAll(params),
    refetchInterval: 60000,
  });
};

export const useAllAccountsSummary = () => {
  return useQuery({
    queryKey: ["allAccountsSummary"],
    queryFn: async () => {
      const [
        twitterResponse,
        facebookResponse,
        instagramResponse,
        tiktokResponse,
        youtubeResponse,
      ] = await Promise.allSettled([
        accountsAPI.getAll(),
        facebookAPI.getAccounts(),
        instagramAPI.getAccounts(),
        tiktokAPI.getAccounts(),
        youtubeAPI.getChannels(),
      ]);

      const getCount = (response, keys = ["accounts"]) => {
        if (response.status !== "fulfilled") return 0;

        const value = response.value;
        if (Array.isArray(value)) return value.length;

        for (const key of keys) {
          if (Array.isArray(value?.[key])) {
            return value[key].length;
          }
        }

        return 0;
      };

      const platformCounts = {
        twitter: getCount(twitterResponse, ["accounts"]),
        facebook: getCount(facebookResponse, ["accounts"]),
        instagram: getCount(instagramResponse, ["accounts"]),
        tiktok: getCount(tiktokResponse, ["accounts"]),
        youtube: getCount(youtubeResponse, ["channels", "accounts", "data"]),
      };

      return {
        count: Object.values(platformCounts).reduce((sum, value) => sum + value, 0),
        platformCounts,
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

export const useAccount = (id) => {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => accountsAPI.getOne(id),
    enabled: !!id,
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username) => accountsAPI.add({ username }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["alertStats"] });
      toast.success(data.message || "Account added successfully");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useRemoveAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => accountsAPI.remove(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["alertStats"] });
      toast.success(data.message || "Account removed");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useRemoveFacebookAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => facebookAPI.removeAccount(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(data.message || "Account removed");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdateAccountStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => accountsAPI.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(data.message || "Status updated");
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useRefreshAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => accountsAPI.refresh(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Profile refreshed");
    },
    onError: (error) => toast.error(error.message),
  });
};
