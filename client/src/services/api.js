import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mx_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid token: clear and return to login.
      localStorage.removeItem("mx_token");
      localStorage.removeItem("mx_user");
      const { pathname } = window.location;
      if (pathname !== "/login" && pathname !== "/register") {
        window.location.assign("/login");
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// Facebook API - Define first before using in dashboardAPI
const facebookApi = axios.create({
  baseURL: "http://" + location.hostname + ":5001/facebook",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for Facebook API
facebookApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// YouTube API
const youtubeApi = axios.create({
  baseURL: "http://" + location.hostname + ":5002/youtube",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for YouTube API
youtubeApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// Instagram API
const instagramApi = axios.create({
  baseURL: "http://" + location.hostname + ":5003/instagram",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for Instagram API
instagramApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// TikTok API
const tiktokApi = axios.create({
  baseURL: "http://" + location.hostname + ":5004/tiktok",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

tiktokApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

// Accounts API
export const accountsAPI = {
  getAll: (params) => api.get("/accounts", { params }),
  getOne: (id) => api.get(`/accounts/${id}`),
  add: (data) => api.post("/accounts", data),
  remove: (id) => api.delete(`/accounts/${id}`),
  updateStatus: (id, status) => api.put(`/accounts/${id}/status`, { status }),
  refresh: (id) => api.put(`/accounts/${id}/refresh`),
  getStats: (id) => api.get(`/accounts/${id}/stats`),
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get("/alerts", { params }),
  getOne: (id) => api.get(`/alerts/${id}`),
  getStats: () => api.get("/alerts/stats"),
  getUnreadCount: () => api.get("/alerts/unread-count"),
  markRead: (alertIds) => api.put("/alerts/mark-read", { alertIds }),
  markAllRead: () => api.put("/alerts/mark-all-read"),
  markViewed: (id) => api.put(`/alerts/${id}/viewed`),
  delete: (id) => api.delete(`/alerts/${id}`),
  deleteAll: () => api.delete("/alerts"),
};

// Dashboard API (multi-platform)
export const dashboardAPI = {
  getStats: (platform = "all", days = 7) =>
    api.get("/dashboard/stats", { params: { platform, days } }),
  getMentions: (platform = "twitter", limit = 10) =>
    api.get("/dashboard/mentions", { params: { platform, limit } }),
  getTimeline: (platform = "twitter", days = 7) =>
    api.get("/dashboard/timeline", { params: { platform, days } }),
  getAccounts: (platform = "twitter") =>
    api.get("/dashboard/accounts", { params: { platform } }),
  getKeywords: () => api.get("/dashboard/keywords"),
  addKeyword: (word) => api.post("/dashboard/keywords", { word }),
  removeKeyword: (id) => api.delete(`/dashboard/keywords/${id}`),
  // Facebook-specific methods (using properly defined facebookApi)
  facebookGetAlerts: () => facebookApi.get("/alerts"),
  facebookGetAccounts: () => facebookApi.get("/accounts"),
  // YouTube-specific methods - fetch ALL videos without limit for accurate totals
  youtubeGetVideos: (params) =>
    youtubeApi
      .get("/videos", { params: { limit: 1000, ...params } })
      .catch(() => ({ videos: [] })),
  youtubeGetChannels: () =>
    youtubeApi.get("/channels").catch(() => ([])),
};

export const facebookAPI = {
  addAccount: (data) => facebookApi.post("/accounts", data),
  getAccounts: () => facebookApi.get("/accounts"),
  removeAccount: (id) => facebookApi.delete(`/accounts/${id}`),
  updateAccountStatus: (id, status) => facebookApi.patch(`/accounts/${id}/status`, { monitoringStatus: status }),
  refreshAccount: (id) => facebookApi.put(`/accounts/${id}/refresh`),
  fetchPosts: (accountId) => facebookApi.post(`/posts/${accountId}/fetch`),
  getPosts: (accountId) => facebookApi.get(`/posts/${accountId}`),
  getAlerts: (params) => facebookApi.get("/alerts", { params }),
  getAlert: (id) => facebookApi.get(`/alerts/${id}`),
  markViewed: (id) => facebookApi.put(`/alerts/${id}/viewed`),
  getStats: (days = 7) =>
    facebookApi.get("/alerts/stats", { params: { days } }),
  markAllRead: () => facebookApi.put("/alerts/mark-all-read"),
};

export const instagramAPI = {
  addAccount: (data) => instagramApi.post("/accounts", data),
  getAccounts: () => instagramApi.get("/accounts"),
  removeAccount: (id) => instagramApi.delete(`/accounts/${id}`),
  updateAccountStatus: (id, status) => instagramApi.patch(`/accounts/${id}/status`, { monitoringStatus: status }),
  refreshAccount: (id) => instagramApi.put(`/accounts/${id}/refresh`),
  fetchPosts: (accountId) => instagramApi.post(`/posts/${accountId}/fetch`),
  getPosts: (accountId) => instagramApi.get(`/posts/${accountId}`),
  getAlerts: (params) => instagramApi.get("/alerts", { params }),
  getAlert: (id) => instagramApi.get(`/alerts/${id}`),
  markViewed: (id) => instagramApi.put(`/alerts/${id}/viewed`),
  getStats: (days = 7) =>
    instagramApi.get("/dashboard/stats", { params: { days } }),
  markAllRead: () => instagramApi.put("/alerts/mark-all-read"),
  getDashboardStats: (days = 7) =>
    instagramApi.get("/dashboard/stats", { params: { days } }),
  getDashboardMentions: (limit = 100) =>
    instagramApi.get("/dashboard/mentions", { params: { limit } }),
  getDashboardTimeline: (days = 7) =>
    instagramApi.get("/dashboard/timeline", { params: { days } }),
  getDashboardAccounts: () => instagramApi.get("/dashboard/accounts"),
};

export const tiktokAPI = {
  addAccount: (data) => tiktokApi.post("/accounts", data),
  getAccounts: () => tiktokApi.get("/accounts"),
  removeAccount: (id) => tiktokApi.delete(`/accounts/${id}`),
  updateAccountStatus: (id, status) =>
    tiktokApi.patch(`/accounts/${id}/status`, { monitoringStatus: status }),
  refreshAccount: (id) => tiktokApi.put(`/accounts/${id}/refresh`),
  fetchPosts: (accountId) => tiktokApi.post(`/posts/${accountId}/fetch`),
  getPosts: (accountId) => tiktokApi.get(`/posts/${accountId}`),
  getAlerts: (params) => tiktokApi.get("/alerts", { params }),
  getAlert: (id) => tiktokApi.get(`/alerts/${id}`),
  markViewed: (id) => tiktokApi.put(`/alerts/${id}/viewed`),
  markAllRead: () => tiktokApi.put("/alerts/mark-all-read"),
};

export const youtubeAPI = {
  // Channel endpoints
  addChannel: (data) => youtubeApi.post("/channels", data),
  getChannels: () => youtubeApi.get("/channels"),
  getChannel: (id) => youtubeApi.get(`/channels/${id}`),
  removeChannel: (id) => youtubeApi.delete(`/channels/${id}`),
  updateChannelStatus: (id, status) =>
    youtubeApi.patch(`/channels/${id}/status`, { monitoringStatus: status }),
  // Refresh a specific channel's profile/metadata
  refreshChannel: (id) => youtubeApi.put(`/channels/${id}/refresh`),

  // Video endpoints
  getAllVideos: (params) => youtubeApi.get("/videos", { params }),
  getVideosByChannel: (channelId, params) =>
    youtubeApi.get(`/videos/channel/${channelId}`, { params }),
  getVideo: (videoId) => youtubeApi.get(`/videos/${videoId}`),
  markVideoAsViewed: (videoId) => youtubeApi.patch(`/videos/${videoId}/viewed`),
  markAllVideosAsViewed: () => youtubeApi.patch("/videos/mark-all-viewed"),
  getVideoStats: () => youtubeApi.get("/videos/stats"),
};

export default api;
