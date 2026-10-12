import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { alertsAPI } from "../services/api";
import { normalizeProfileImageUrl } from "../utils/avatar";

const SocketContext = createContext(null);

const getAlertId = (alert = {}) => {
  const id = alert._id || alert.tweetId || alert.videoId;
  if (!id) return `${Date.now()}_${Math.random()}`;
  return typeof id === "string"
    ? id
    : id?.toString?.() || `${Date.now()}_${Math.random()}`;
};

const formatTimestamp = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleTimeString();
};

const toAlertArray = (payload) => {
  if (Array.isArray(payload?.alerts)) return payload.alerts;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const SocketProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [twitterSocket, setTwitterSocket] = useState(null);
  const [facebookSocket, setFacebookSocket] = useState(null);
  const [youtubeSocket, setYoutubeSocket] = useState(null);
  const [instagramSocket, setInstagramSocket] = useState(null);
  const [tiktokSocket, setTiktokSocket] = useState(null);
  const [connected, setConnected] = useState({
    twitter: false,
    facebook: false,
    youtube: false,
    instagram: false,
    tiktok: false,
  });
  const [unreadIds, setUnreadIds] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [viewedAlerts, setViewedAlerts] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const alertCallbacksRef = useRef([]);
  const alertAudioRef = useRef(null);
  const alertAudioReadyRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const activeRingIdsRef = useRef(new Set());
  const viewedAlertIdsRef = useRef(new Set());
  const ringIntervalRef = useRef(null);
  const toastByAlertIdRef = useRef(new Map());
  const isTonePlayingRef = useRef(false);

  const buildAlertAudio = useCallback(() => {
    const audio = new Audio();
    audio.src = "/sounds/alert.mp3";
    audio.preload = "auto";
    audio.autoPlay = false;
    audio.muted = false;
    audio.volume = 1;
    audio.setAttribute("playsinline", "");
    try {
      audio.crossOrigin = "anonymous";
    } catch {}
    audio.addEventListener(
      "canplaythrough",
      () => {
        alertAudioReadyRef.current = true;
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        alertAudioReadyRef.current = false;
      },
      { once: false },
    );
    try {
      audio.load();
    } catch {}
    return audio;
  }, []);

  const primeAudioUnlock = useCallback(() => {
    if (audioUnlockedRef.current) return;
    try {
      let audio = alertAudioRef.current;
      if (!audio) {
        audio = buildAlertAudio();
        alertAudioRef.current = audio;
      }
      const wasMuted = audio.muted;
      const prevVolume = audio.volume;
      audio.muted = true;
      audio.volume = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {}).finally(() => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {}
          audio.muted = wasMuted;
          audio.volume = prevVolume;
          audioUnlockedRef.current = true;
        });
      } else {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
        audio.muted = wasMuted;
        audio.volume = prevVolume;
        audioUnlockedRef.current = true;
      }
    } catch {
      audioUnlockedRef.current = true;
    }
  }, [buildAlertAudio]);

  const playRingTone = useCallback(() => {
    if (isTonePlayingRef.current) return;
    try {
      let audio = alertAudioRef.current;
      if (!audio) {
        audio = buildAlertAudio();
        alertAudioRef.current = audio;
      }

      isTonePlayingRef.current = true;

      try {
        audio.pause();
      } catch {}
      try {
        audio.currentTime = 0;
      } catch {}

      const promise = audio.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          try {
            const retry = buildAlertAudio();
            alertAudioRef.current = retry;
            const r2 = retry.play();
            if (r2 && typeof r2.catch === "function") r2.catch(() => {});
          } catch {}
        });
      }

      const releaseTimer = window.setTimeout(() => {
        isTonePlayingRef.current = false;
      }, 980);

      return () => window.clearTimeout(releaseTimer);
    } catch {
      isTonePlayingRef.current = false;
    }
  }, [buildAlertAudio]);

  useEffect(() => {
    const audio = buildAlertAudio();
    alertAudioRef.current = audio;

    const unlockEvents = ["pointerdown", "keydown", "touchstart", "mousedown"];
    const handleUnlockOnce = () => {
      if (audioUnlockedRef.current) return;
      primeAudioUnlock();
      if (audioUnlockedRef.current) {
        unlockEvents.forEach((evt) => {
          document.removeEventListener(evt, handleUnlockOnce, true);
        });
      }
    };
    unlockEvents.forEach((evt) => {
      document.addEventListener(evt, handleUnlockOnce, {
        capture: true,
        passive: true,
      });
    });

    const readyTimer = window.setTimeout(() => {
      primeAudioUnlock();
    }, 2500);

    return () => {
      window.clearTimeout(readyTimer);
      unlockEvents.forEach((evt) => {
        document.removeEventListener(evt, handleUnlockOnce, true);
      });
      if (alertAudioRef.current) {
        try {
          alertAudioRef.current.pause();
        } catch {}
        alertAudioRef.current = null;
      }
      alertAudioReadyRef.current = false;
    };
  }, [buildAlertAudio, primeAudioUnlock]);

  const handleToastClick = (alert) => {
    const platform = alert.platform || "facebook";
    const alertId = getAlertId(alert);
    navigate(`/alerts/${platform}/${alertId}`);
    markAlertViewed(alertId);
  };

  // One tone per alert. This used to re-fire every 1100ms for as long as any
  // alert stayed unviewed, so a single notification rang continuously until
  // someone clicked it - and a busy feed rang without pause. The alert still
  // stays "active" (the badge and the unviewed state are unchanged); only the
  // sound stops repeating.
  const ensureRingLoop = useCallback(() => {
    if (activeRingIdsRef.current.size === 0) return;
    playRingTone();
  }, [playRingTone]);

  const stopRingLoopIfIdle = useCallback(() => {
    if (activeRingIdsRef.current.size > 0) return;
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  const startAlertRing = useCallback(
    (alertId) => {
      if (!alertId) return;
      activeRingIdsRef.current.add(alertId);
      ensureRingLoop();
    },
    [ensureRingLoop],
  );

  const stopAlertRing = useCallback(
    (alertId) => {
      if (!alertId) return;
      activeRingIdsRef.current.delete(alertId);
      stopRingLoopIfIdle();
    },
    [stopRingLoopIfIdle],
  );

  const removeToastForAlert = useCallback((alertId) => {
    const toastId = toastByAlertIdRef.current.get(alertId);
    if (toastId) {
      toast.dismiss(toastId);
      toastByAlertIdRef.current.delete(alertId);
    }
  }, []);

  const persistViewedStatus = useCallback(
    async (alertId) => {
      try {
        await alertsAPI.markViewed(alertId);
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      } catch {
        // Keep UI responsive even if API fails temporarily.
      }
    },
    [queryClient],
  );

  const markAlertViewed = useCallback(
    (alertId, options = {}) => {
      const { persist = true } = options;
      if (!alertId) return;

      setUnreadIds((prev) => prev.filter((id) => id !== alertId));

      let viewedAlert = null;
      setRecentAlerts((prev) => {
        return prev.map((item) => {
          if (item._id !== alertId) return item;
          viewedAlert = {
            ...item,
            isViewed: true,
            isRead: true,
            viewedAt: new Date().toISOString(),
            status: "Viewed",
          };
          return viewedAlert;
        });
      });

      if (viewedAlert) {
        setViewedAlerts((prev) => [viewedAlert, ...prev].slice(0, 30));
      }

      stopAlertRing(alertId);
      removeToastForAlert(alertId);

      if (persist) {
        persistViewedStatus(alertId);
      }
    },
    [persistViewedStatus, removeToastForAlert, stopAlertRing],
  );

  const showPersistentToast = useCallback(
    (alert, message) => {
      const alertId = getAlertId(alert);
      const platform = (alert.platform || "twitter").toLowerCase();
      const sourceLabel = platform.toUpperCase();
      const displayName = alert.displayName || alert.source || alert.username;

      const existingToastId = toastByAlertIdRef.current.get(alertId);
      if (existingToastId) {
        toast.dismiss(existingToastId);
        toastByAlertIdRef.current.delete(alertId);
      }

      // Use the existing toast thumbnail slot for the Instagram post image.
      // Do not add a second image; this is the displayUrl/profile-image slot.
      let toastImage =
        normalizeProfileImageUrl(alert.profileImage || alert.profilePic) ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.username || alert.source || "user"}`;

      if (platform === "instagram") {
        let thumb =
          alert.displayUrl ||
          alert.url ||
          alert.profileImage ||
          (Array.isArray(alert.images) && alert.images.length > 0
            ? typeof alert.images[0] === "string"
              ? alert.images[0]
              : alert.images[0]?.url
            : null);

        if (
          thumb &&
          (thumb.includes("cdninstagram.com") ||
            thumb.includes("fbcdn.net") ||
            thumb.includes("fna.fbcdn"))
        ) {
          thumb = `http://${location.hostname}:5003/instagram/posts/proxy/image?url=${encodeURIComponent(thumb)}`;
        }

        toastImage = thumb || toastImage;
      }

      // A compact single line, not a card: name, what it is, and which platform.
      // The full alert is one click away, so the toast only has to say enough to
      // decide whether to look now.
      const toastId = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-slide-in-right" : "opacity-0"
            } bg-white border border-border rounded-full py-2 pl-2 pr-3 shadow-lift flex items-center gap-2 cursor-pointer max-w-[380px]`}
            onClick={() => {
              navigate(`/alerts/${platform}/${alertId}`);
              markAlertViewed(alertId);
            }}
            title={message || displayName}
          >
            <img
              src={toastImage}
              alt=""
              className="w-6 h-6 rounded-full flex-shrink-0 object-cover border border-border"
              onError={(e) => {
                const fallback =
                  normalizeProfileImageUrl(alert.profileImage || alert.profilePic) ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.username || alert.source || "user"}`;
                if (e.target.src !== fallback) e.target.src = fallback;
              }}
            />
            <span className="text-slate-900 font-semibold text-xs truncate max-w-[130px]">
              {displayName}
            </span>
            {alert.activityType && (
              <span className="text-[10px] text-slate-500 truncate max-w-[90px]">
                {alert.activityType}
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-cyan-200 text-cyan-700 uppercase flex-shrink-0">
              {sourceLabel}
            </span>
          </div>
        ),
        {
          // Auto-dismisses; it no longer waits to be clicked.
          duration: 15000,
          position: "bottom-right",
        },
      );

      toastByAlertIdRef.current.set(alertId, toastId);
    },
    [markAlertViewed, navigate],
  );

  const onNewAlert = useCallback((callback) => {
    alertCallbacksRef.current.push(callback);
    return () => {
      alertCallbacksRef.current = alertCallbacksRef.current.filter(
        (cb) => cb !== callback,
      );
    };
  }, []);

  const syncUnreadFromServer = useCallback(async () => {
    try {
      const payload = await alertsAPI.getAll({
        page: 1,
        limit: 150,
        isViewed: false,
      });
      const alerts = toAlertArray(payload);
      const ids = alerts.map((a) => getAlertId(a));

      setUnreadIds(ids);
      setRecentAlerts((prev) => {
        const byId = new Map(prev.map((a) => [a._id, a]));
        alerts.forEach((a) => {
          const id = getAlertId(a);
          byId.set(id, {
            ...a,
            _id: id,
            isViewed: false,
            isRead: false,
          });
        });

        return Array.from(byId.values())
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.tweetCreatedAt) -
              new Date(a.createdAt || a.tweetCreatedAt),
          )
          .slice(0, 100);
      });

      const unreadIdSet = new Set(ids);
      activeRingIdsRef.current.forEach((id) => {
        if (!unreadIdSet.has(id)) {
          activeRingIdsRef.current.delete(id);
          removeToastForAlert(id);
        }
      });

      ids.forEach((id) => activeRingIdsRef.current.add(id));
      // Deliberately silent. This runs once when the socket connects and only
      // reconciles which alerts are still unviewed; it is not an arrival. Ringing
      // here meant opening the app with a backlog played the alert tone even
      // though nothing had just happened. The tone belongs to the socket's
      // new-alert handler.
      if (ids.length === 0) {
        stopRingLoopIfIdle();
      }
    } catch {
      // If sync fails, local socket state is still used.
    }
  }, [ensureRingLoop, removeToastForAlert, stopRingLoopIfIdle]);

  useEffect(() => {
    viewedAlertIdsRef.current = new Set(
      viewedAlerts.map((alert) => getAlertId(alert)),
    );
  }, [viewedAlerts]);

  useEffect(() => {
    // Twitter Socket Connection
    const twitterSocketInstance = io("http://" + location.hostname + ":5000", {
      auth: {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    twitterSocketInstance.on("connect", () => {
      setConnected((prev) => ({ ...prev, twitter: true }));
      twitterSocketInstance.emit("join_monitoring");
    });

    twitterSocketInstance.on("disconnect", () => {
      setConnected((prev) => ({ ...prev, twitter: false }));
    });

    // Facebook Socket Connection
    const facebookSocketInstance = io("http://" + location.hostname + ":5001", {
      auth: {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    facebookSocketInstance.on("connect", () => {
      setConnected((prev) => ({ ...prev, facebook: true }));
      facebookSocketInstance.emit("join_monitoring");
    });

    facebookSocketInstance.on("disconnect", () => {
      setConnected((prev) => ({ ...prev, facebook: false }));
    });

    // YouTube Socket Connection
    const youtubeSocketInstance = io("http://" + location.hostname + ":5002", {
      auth: {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    youtubeSocketInstance.on("connect", () => {
      setConnected((prev) => ({ ...prev, youtube: true }));
      youtubeSocketInstance.emit("join_monitoring");
    });

    youtubeSocketInstance.on("disconnect", () => {
      setConnected((prev) => ({ ...prev, youtube: false }));
    });

    // Instagram Socket Connection
    const instagramSocketInstance = io(
      "http://" + location.hostname + ":5003",
      {
        auth: {},
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"],
      },
    );

    instagramSocketInstance.on("connect", () => {
      setConnected((prev) => ({ ...prev, instagram: true }));
      instagramSocketInstance.emit("join_monitoring");
    });

    instagramSocketInstance.on("disconnect", () => {
      setConnected((prev) => ({ ...prev, instagram: false }));
    });

    const tiktokSocketInstance = io("http://" + location.hostname + ":5004", {
      auth: {},
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    tiktokSocketInstance.on("connect", () => {
      setConnected((prev) => ({ ...prev, tiktok: true }));
      tiktokSocketInstance.emit("join_monitoring");
    });

    tiktokSocketInstance.on("disconnect", () => {
      setConnected((prev) => ({ ...prev, tiktok: false }));
    });

    twitterSocketInstance.on("new_alert", (data) => {
      const { alert, message } = data;
      const normalizedAlert = {
        ...alert,
        _id: getAlertId(alert),
        status: "Unviewed",
        receivedAt: new Date().toISOString(),
        platform: (alert?.platform || "twitter").toLowerCase(),
        isViewed: false,
        isRead: false,
      };

      setUnreadIds((prev) =>
        prev.includes(normalizedAlert._id)
          ? prev
          : [normalizedAlert._id, ...prev],
      );

      setActiveAlerts((prev) => {
        if (prev.some((item) => item._id === normalizedAlert._id)) return prev;
        return [normalizedAlert, ...prev];
      });

      setRecentAlerts((prev) => {
        const next = [
          normalizedAlert,
          ...prev.filter((item) => item._id !== normalizedAlert._id),
        ];
        return next.slice(0, 30);
      });

      startAlertRing(normalizedAlert._id);
      showPersistentToast(normalizedAlert, message);

      alertCallbacksRef.current.forEach((cb) => cb(normalizedAlert));
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({
        queryKey: ["alert", normalizedAlert._id],
      });
      // CRITICAL: Update combined stats for "All Social" dashboard
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });
    });

    facebookSocketInstance.on("new_facebook_alert", (alert) => {
      console.log("Received new facebook alert:", alert);
      const alertId = getAlertId(alert);

      if (viewedAlertIdsRef.current.has(alertId)) {
        return;
      }

      const normalizedAlert = {
        ...alert,
        _id: alertId,
        platform: "facebook",
        status: "Unviewed",
        receivedAt: new Date().toISOString(),
        isViewed: false,
        isRead: false,
        // Normalize field names for toast display
        username: alert.source || alert.username,
        displayName: alert.displayName || alert.source,
        profileImage: alert.profilePic || alert.profileImage,
        activityType: "post",
      };

      setUnreadIds((prev) =>
        prev.includes(alertId) ? prev : [alertId, ...prev],
      );

      setRecentAlerts((prev) => {
        const next = [
          normalizedAlert,
          ...prev.filter((item) => item._id !== alertId),
        ];
        return next.slice(0, 30);
      });

      startAlertRing(alertId);
      showPersistentToast(
        normalizedAlert,
        alert.content || "New post from " + alert.source,
      );

      // Invalidate all Facebook dashboard queries to refresh with latest data
      queryClient.invalidateQueries({ queryKey: ["facebookStats"] });
      queryClient.invalidateQueries({ queryKey: ["facebookAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["facebookAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["facebookTimeline"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      // CRITICAL: Update combined stats for "All Social" dashboard
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });

      alertCallbacksRef.current.forEach((cb) => cb(normalizedAlert));
    });

    youtubeSocketInstance.on("new_youtube_alert", (data) => {
      console.log("Received new YouTube alert:", data);
      const { alert, message } = data;
      const alertId = getAlertId(alert);

      if (viewedAlertIdsRef.current.has(alertId)) {
        return;
      }

      const normalizedAlert = {
        ...alert,
        _id: alertId,
        platform: "youtube",
        status: "Unviewed",
        receivedAt: new Date().toISOString(),
        isViewed: false,
        isRead: false,
        // Normalize field names for toast display
        username: alert.channelName || alert.source,
        displayName: alert.channelName || alert.source,
        channelProfileImage: alert.channelProfileImage,
        profileImage:
          alert.channelProfileImage ||
          alert.channelThumbnail ||
          alert.thumbnail,
        activityType: "video",
      };

      setUnreadIds((prev) =>
        prev.includes(alertId) ? prev : [alertId, ...prev],
      );

      setRecentAlerts((prev) => {
        const next = [
          normalizedAlert,
          ...prev.filter((item) => item._id !== alertId),
        ];
        return next.slice(0, 30);
      });

      startAlertRing(alertId);
      showPersistentToast(
        normalizedAlert,
        message || `New video: "${alert.videoTitle}"`,
      );

      // Invalidate all YouTube dashboard queries and combined stats to refresh with latest data
      queryClient.invalidateQueries({ queryKey: ["youtubeStats"] });
      queryClient.invalidateQueries({ queryKey: ["youtubeAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["youtubeAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["youtube"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      // CRITICAL: Update combined stats for "All Social" dashboard
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });

      alertCallbacksRef.current.forEach((cb) => cb(normalizedAlert));
    });

    instagramSocketInstance.on("new_instagram_alert", (alert) => {
      console.log("Received new Instagram alert:", alert);
      const alertId = getAlertId(alert);

      if (viewedAlertIdsRef.current.has(alertId)) {
        return;
      }

      const normalizedAlert = {
        ...alert,
        _id: alertId,
        platform: "instagram",
        status: "Unviewed",
        receivedAt: new Date().toISOString(),
        isViewed: false,
        isRead: false,
        // Normalize field names for toast display
        username: alert.source || alert.username,
        displayName: alert.displayName || alert.source,
        profileImage: alert.displayUrl || alert.profileImage,
        activityType: alert.type || "post",
      };

      setUnreadIds((prev) =>
        prev.includes(alertId) ? prev : [alertId, ...prev],
      );

      setRecentAlerts((prev) => {
        const next = [
          normalizedAlert,
          ...prev.filter((item) => item._id !== alertId),
        ];
        return next.slice(0, 30);
      });

      startAlertRing(alertId);
      showPersistentToast(
        normalizedAlert,
        alert.caption || alert.content || "New post from " + alert.source,
      );

      // Invalidate all Instagram dashboard queries to refresh with latest data
      queryClient.invalidateQueries({ queryKey: ["instagramStats"] });
      queryClient.invalidateQueries({ queryKey: ["instagramAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["instagramAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["instagramTimeline"] });
      queryClient.invalidateQueries({ queryKey: ["instagram"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      // CRITICAL: Update combined stats for "All Social" dashboard
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });

      alertCallbacksRef.current.forEach((cb) => cb(normalizedAlert));
    });

    tiktokSocketInstance.on("new_tiktok_alert", (alert) => {
      console.log("Received new TikTok alert:", alert);
      const alertId = getAlertId(alert);

      if (viewedAlertIdsRef.current.has(alertId)) {
        return;
      }

      const normalizedAlert = {
        ...alert,
        _id: alertId,
        platform: "tiktok",
        status: "Unviewed",
        receivedAt: new Date().toISOString(),
        isViewed: false,
        isRead: false,
        username: alert.source || alert.authorUsername,
        displayName: alert.authorDisplayName || alert.source,
        profileImage: alert.authorProfilePic || alert.profileImage,
        activityType: alert.postType || "post",
      };

      setUnreadIds((prev) =>
        prev.includes(alertId) ? prev : [alertId, ...prev],
      );

      setRecentAlerts((prev) => {
        const next = [
          normalizedAlert,
          ...prev.filter((item) => item._id !== alertId),
        ];
        return next.slice(0, 30);
      });

      startAlertRing(alertId);
      showPersistentToast(
        normalizedAlert,
        alert.content || "New post from " + alert.source,
      );

      queryClient.invalidateQueries({ queryKey: ["tiktokStats"] });
      queryClient.invalidateQueries({ queryKey: ["tiktokDashboardAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["tiktokAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["tiktokTimeline"] });
      queryClient.invalidateQueries({ queryKey: ["tiktokAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["combinedStats"] });

      alertCallbacksRef.current.forEach((cb) => cb(normalizedAlert));
    });

    twitterSocketInstance.on("connect_error", (err) => {
      console.warn("Twitter socket connection error:", err.message);
    });

    facebookSocketInstance.on("connect_error", (err) => {
      console.warn("Facebook socket connection error:", err.message);
    });

    youtubeSocketInstance.on("connect_error", (err) => {
      console.warn("YouTube socket connection error:", err.message);
    });

    instagramSocketInstance.on("connect_error", (err) => {
      console.warn("Instagram socket connection error:", err.message);
    });

    tiktokSocketInstance.on("connect_error", (err) => {
      console.warn("TikTok socket connection error:", err.message);
    });

    setTwitterSocket(twitterSocketInstance);
    setFacebookSocket(facebookSocketInstance);
    setYoutubeSocket(youtubeSocketInstance);
    setInstagramSocket(instagramSocketInstance);
    setTiktokSocket(tiktokSocketInstance);
    syncUnreadFromServer();

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      isTonePlayingRef.current = false;
      activeRingIdsRef.current.clear();
      toastByAlertIdRef.current.forEach((toastId) => toast.dismiss(toastId));
      toastByAlertIdRef.current.clear();
      twitterSocketInstance.disconnect();
      facebookSocketInstance.disconnect();
      youtubeSocketInstance.disconnect();
      instagramSocketInstance.disconnect();
      tiktokSocketInstance.disconnect();
      setTwitterSocket(null);
      setFacebookSocket(null);
      setYoutubeSocket(null);
      setInstagramSocket(null);
      setTiktokSocket(null);
      setConnected({
        twitter: false,
        facebook: false,
        youtube: false,
        instagram: false,
        tiktok: false,
      });
    };
  }, [queryClient, showPersistentToast, startAlertRing, syncUnreadFromServer]);

  useEffect(() => {
    const unreadIdSet = new Set(unreadIds);
    setActiveAlerts(
      recentAlerts
        .filter((alert) => unreadIdSet.has(alert._id))
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.tweetCreatedAt) -
            new Date(a.createdAt || a.tweetCreatedAt),
        ),
    );
  }, [recentAlerts, unreadIds]);

  const clearNotifications = useCallback(() => {
    // Keep for backward compatibility; notifications are now cleared per-alert only.
  }, []);

  const unreadCount = unreadIds.length;

  return (
    <SocketContext.Provider
      value={{
        socket:
          twitterSocket ||
          facebookSocket ||
          youtubeSocket ||
          instagramSocket ||
          tiktokSocket,
        twitterSocket,
        facebookSocket,
        youtubeSocket,
        instagramSocket,
        tiktokSocket,
        connected,
        unreadCount,
        activeAlerts,
        viewedAlerts,
        recentAlerts,
        onNewAlert,
        markAlertViewed,
        stopAlertRing,
        removeToastForAlert,
        clearNotifications,
        syncUnreadFromServer,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};

export default SocketContext;
