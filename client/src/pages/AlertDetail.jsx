// src/pages/AlertDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Quote,
  ExternalLink,
  Video,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Layers,
  Eye,
  EyeOff,
  Share2,
  Calendar,
  Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import DashboardLayout from "../layouts/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAlertDetail, useMarkAlertViewed } from "../hooks/useAlerts";
import { useMarkFacebookAlertViewed } from "../hooks/facebook/useFacebookAlerts";
import { useMarkYoutubeVideoAsViewed } from "../hooks/youtube/useYoutubeAlerts";
import { useSocket } from "../context/SocketContext";
import { getPlatformUrl } from "../utils/platformUrls";
import { getProxiedImageUrl } from "../utils/imageProxy";
import { normalizeProfileImageUrl } from "../utils/avatar";
import { getInstagramContent } from "../utils/instagramContent";
import {
  getInstagramVideoSource,
  getInstagramImageSource,
} from "../utils/instagram/mediaUtils";
import { detectTwitterPostType } from "../utils/twitterPostTypeDetection";

// Platform color mapping
const getPlatformColor = (platform) => {
  const colors = {
    twitter: "#1DA1F2",
    facebook: "#1877F2",
    instagram: "#E4405F",
    youtube: "#FF0000",
    tiktok: "#000000",
  };
  return colors[platform] || "#64748B";
};

const PLATFORM_UI = {
  twitter: {
    title: "Twitter Alert",
    border: "border-sky-200",
    pill: "text-sky-700 border-sky-200 bg-sky-50",
    bg: "bg-sky-50",
  },
  facebook: {
    title: "Facebook Alert",
    border: "border-blue-200",
    pill: "text-blue-700 border-blue-200 bg-blue-50",
    bg: "bg-blue-50",
  },
  instagram: {
    title: "Instagram Alert",
    border: "border-pink-200",
    pill: "text-pink-700 border-pink-200 bg-pink-50",
    bg: "bg-pink-50",
  },
  youtube: {
    title: "YouTube Alert",
    border: "border-red-200",
    pill: "text-red-700 border-red-200 bg-red-50",
    bg: "bg-red-50",
  },
  tiktok: {
    title: "TikTok Alert",
    border: "border-border",
    pill: "text-black border-border bg-slate-50",
    bg: "bg-slate-50",
  },
};

const AlertDetail = () => {
  const [expandDescription, setExpandDescription] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  const { id, platform } = useParams();
  const { markAlertViewed } = useSocket();
  const platformKey = (platform || "twitter").toLowerCase();

  // Use platform-specific hooks
  const markViewedMutation = useMarkAlertViewed(platformKey);
  const markFacebookViewedMutation = useMarkFacebookAlertViewed();
  const markYoutubeViewedMutation = useMarkYoutubeVideoAsViewed();
  const { data, isLoading, isError } = useAlertDetail(id, platformKey);

  const alert = data?.alert || data?.data || data;
  const ui = useMemo(
    () => PLATFORM_UI[platformKey] || PLATFORM_UI.twitter,
    [platformKey],
  );
  const platformUrl = getPlatformUrl(alert);

  // Detect Twitter post type
  const isTwitter = platformKey === 'twitter';
  const postType = isTwitter ? detectTwitterPostType(
    alert?.activityType,
    alert?.media,
    alert?.content
  ) : null;

  const getPostTypeIcon = () => {
    if (!isTwitter) return null;
    switch (postType) {
      case 'RETWEET': return <Repeat2 size={14} className="text-green-600" />;
      case 'REPLY': return <MessageCircle size={14} className="text-purple-600" />;
      case 'QUOTE': return <Quote size={14} className="text-red-600" />;
      case 'IMAGE': return <Image size={14} className="text-cyan-600" />;
      case 'VIDEO': return <Video size={14} className="text-orange-600" />;
      case 'THREAD': return <Layers size={14} className="text-yellow-600" />;
      default: return <FileText size={14} className="text-blue-600" />;
    }
  };

  const getPostTypeLabel = () => {
    if (!isTwitter) return null;
    switch (postType) {
      case 'RETWEET': return 'Retweet';
      case 'REPLY': return 'Reply';
      case 'QUOTE': return 'Quote Tweet';
      case 'IMAGE': return 'Image';
      case 'VIDEO': return 'Video';
      case 'THREAD': return 'Thread';
      default: return 'Tweet';
    }
  };

  useEffect(() => {
    if (!alert?._id) return;
    const isViewed =
      typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead;
    if (!isViewed) {
      markAlertViewed(alert._id, { persist: false });
      if (platformKey === "facebook") {
        markFacebookViewedMutation.mutate(alert._id);
      } else if (platformKey === "youtube") {
        markYoutubeViewedMutation.mutate(alert._id);
      } else {
        markViewedMutation.mutate(alert._id);
      }
    }
    setCarouselIndex(0);
    setImageErrors({});
  }, [alert?._id, platformKey]);

  useEffect(() => {
    if (platformKey !== "twitter" || !alert?.sourceUrl) return;

    const loadTwitterWidgets = () => window.twttr?.widgets?.load();
    const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
    if (existingScript) {
      loadTwitterWidgets();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = loadTwitterWidgets;
    document.body.appendChild(script);
  }, [alert?.sourceUrl, platformKey]);

  useEffect(() => {
    if (platformKey !== "facebook" || !alert?.url) return;

    const loadFacebookSDK = () => {
      if (window.FB) {
        setTimeout(() => {
          window.FB.XFBML.parse();
        }, 100);
        return;
      }

      const existingScript = document.querySelector('script[src*="facebook.com/en_US/sdk.js"]');
      if (existingScript) {
        if (window.FB) {
          setTimeout(() => {
            window.FB.XFBML.parse();
          }, 100);
        }
        return;
      }

      window.fbAsyncInit = function () {
        window.FB.XFBML.parse();
      };

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.FB) {
            window.FB.XFBML.parse();
          }
        }, 100);
      };
      document.body.appendChild(script);
    };

    loadFacebookSDK();
  }, [alert?.url, platformKey, carouselIndex]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading alert details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !alert) {
    return (
      <DashboardLayout>
        <div className="card text-center py-16">
          <p className="text-slate-600 font-medium">Alert not found</p>
          <button
            type="button"
            onClick={() => navigate(`/alerts/${platform}`)}
            className="mt-4 btn-secondary text-sm"
          >
            Back to Alerts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const eventTime = alert.createdAt || alert.tweetCreatedAt || alert.timestamp || alert.publishedAt;
  const platformColor = getPlatformColor(platformKey);
  const isViewed = typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead;
  
  const profileAvatar =
    normalizeProfileImageUrl(
      (platformKey === "youtube" ? alert.channelProfileImage : null) ||
        alert.profileImage ||
        alert.authorProfilePic ||
        alert.profilePic ||
        alert.channelThumbnail,
    ) ||
    `https://ui-avatars.com/api/?name=${alert.username || 'User'}&background=${platformColor.replace('#', '')}&color=fff&size=128`;

  const displayName = alert.displayName || alert.source || alert.channelName || alert.authorDisplayName || `@${alert.username}`;
  const username = alert.username || alert.authorUsername;

  // Get content based on platform
  const getContent = () => {
    if (isTwitter) {
      return alert.content || alert.text || `New ${alert.activityType || 'activity'} on Twitter`;
    }
    if (platformKey === 'youtube') {
      return alert.videoTitle || alert.content || 'New YouTube video';
    }
    return platformKey === "instagram"
      ? getInstagramContent(alert) || `New ${alert.activityType || 'activity'} on ${platformKey}`
      : alert.caption || alert.content || `New ${alert.activityType || 'activity'} on ${platformKey}`;
  };

  const content = getContent();

  // Render Twitter media
  const renderTwitterMedia = () => {
    const mediaItems = alert.media || [];
    if (mediaItems.length === 0) return null;

    const isVideo = alert.activityType === 'video' || postType === 'VIDEO';
    if (isVideo) {
      let videoUrl = null;
      let posterUrl = null;

      if (mediaItems[0]?.variants) {
        const videoVariant = mediaItems[0].variants.find(
          v => v.content_type === 'video/mp4' || v.contentType === 'video/mp4'
        );
        if (videoVariant) {
          videoUrl = videoVariant.url;
        }
        posterUrl = mediaItems[0].preview_image_url || mediaItems[0].image_url;
      }

      if (!videoUrl && mediaItems[0]?.type === 'video') {
        const candidateUrl = mediaItems[0]?.url || mediaItems[0]?.media_url_https;
        const preview = mediaItems[0]?.previewUrl || mediaItems[0]?.preview_image_url || mediaItems[0]?.image_url;
        if (candidateUrl && candidateUrl !== preview) {
          videoUrl = candidateUrl;
        }
        posterUrl = mediaItems[0]?.previewUrl || mediaItems[0]?.preview_image_url || mediaItems[0]?.image_url;
      }

      if (!videoUrl) {
        return (
          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-slate-50 w-full">
            {alert.sourceUrl ? (
              <blockquote className="twitter-tweet" data-dnt="true">
                <a href={alert.sourceUrl}>View this video on X</a>
              </blockquote>
            ) : posterUrl ? (
              <img src={posterUrl} alt="Tweet video thumbnail" className="w-full max-h-[500px] object-contain bg-black" />
            ) : null}
          </div>
        );
      }

      return (
        <div className="mt-4 rounded-xl overflow-hidden bg-black border border-border w-full">
          <video
            controls
            poster={posterUrl}
            className="w-full h-auto max-h-[500px] object-contain bg-black"
          >
            <source src={videoUrl} type="video/mp4" />
            <p className="text-sm text-slate-500 p-4">Your browser doesn't support video playback.</p>
          </video>
        </div>
      );
    }

    if (mediaItems.length > 1) {
      const imageUrls = mediaItems
        .map(m => m.url || m.media_url_https || m.previewUrl)
        .filter(url => url);

      if (imageUrls.length === 0) return null;

      const currentImage = imageUrls[carouselIndex];

      return (
        <div className="mt-4 w-full">
          <div className="relative group rounded-xl overflow-hidden border border-border bg-black/5 w-full">
            {!imageErrors[carouselIndex] && currentImage && (
              <img
                src={currentImage}
                alt={`Media ${carouselIndex + 1}`}
                className="w-full h-auto max-h-[500px] object-contain"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [carouselIndex]: true }));
                }}
              />
            )}
            {imageErrors[carouselIndex] && (
              <div className="w-full h-48 flex items-center justify-center text-slate-400 bg-slate-50">
                <span className="text-sm">Failed to load image</span>
              </div>
            )}

            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={() => setCarouselIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCarouselIndex(prev => (prev + 1) % imageUrls.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {carouselIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    const imageUrl = mediaItems[0]?.url || mediaItems[0]?.media_url_https || mediaItems[0]?.previewUrl;
    if (!imageUrl) return null;

    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-border bg-black/5 w-full">
        <img
          src={imageUrl}
          alt="Tweet media"
          className="w-full h-auto max-h-[500px] object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  };

  // Render other platform media
  const renderOtherPlatformMedia = () => {
    const isInstagram = platformKey === 'instagram';
    const isFacebook = platformKey === 'facebook';
    const isTikTok = platformKey === 'tiktok';
    const isYoutube = platformKey === 'youtube';

    if (isYoutube && alert.thumbnail) {
      return (
        <div className="mt-4 rounded-xl overflow-hidden border border-border bg-black w-full">
          <img
            src={alert.thumbnail}
            alt={alert.videoTitle || 'Video thumbnail'}
            className="w-full h-auto max-h-[500px] object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (isInstagram) {
      const mediaItems = [];
      const postType = alert.postType || alert.type;
      const isCarousel = postType === 'CAROUSEL' || postType === 'Carousel';
      const isVideo = postType === 'VIDEO' || postType === 'Video';

      if (isVideo) {
        const videoUrl = getInstagramVideoSource(alert);
        if (videoUrl) {
          mediaItems.push({
            url: getProxiedImageUrl(videoUrl, 'video'),
            type: 'video',
            poster: alert.displayUrl ? getProxiedImageUrl(alert.displayUrl, 'image') : undefined,
          });
        }
      } else if (isCarousel && Array.isArray(alert.images) && alert.images.length > 0) {
        alert.images.forEach(img => {
          const url = getProxiedImageUrl(img, 'image');
          if (url) mediaItems.push({ url, type: 'image' });
        });
      } else if (alert.displayUrl) {
        const url = getProxiedImageUrl(alert.displayUrl, 'image');
        if (url) mediaItems.push({ url, type: 'image' });
      }

      if (mediaItems.length === 0) return null;

      const currentMedia = mediaItems[carouselIndex] || mediaItems[0];
      const hasMultiple = mediaItems.length > 1;

      return (
        <div className="mt-4 w-full">
          <div className="relative group rounded-xl overflow-hidden border border-border bg-black/5 w-full">
            {currentMedia?.type === 'video' ? (
              <video
                controls
                poster={currentMedia.poster}
                className="w-full h-auto max-h-[500px] object-contain bg-black"
              >
                <source src={currentMedia.url} type="video/mp4" />
              </video>
            ) : (
              <img
                src={currentMedia?.url}
                alt="Media"
                className="w-full h-auto max-h-[500px] object-contain"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [carouselIndex]: true }));
                }}
              />
            )}

            {hasMultiple && (
              <>
                <button
                  onClick={() => setCarouselIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCarouselIndex(prev => (prev + 1) % mediaItems.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {carouselIndex + 1} / {mediaItems.length}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (isFacebook && alert.media && alert.media.length > 0) {
      const isVideoAlert = String(alert.postType || alert.activityType || '').toLowerCase() === 'video';
      const mediaItems = alert.media
        .filter(m => {
          const mediaType = String(m.type || m.__typename || '').toLowerCase();
          const url = m.url || m.previewUrl || m.photo_image?.url || m.photo_image?.uri;
          return (mediaType === 'image' || mediaType === 'photo' || mediaType === 'video' || Boolean(m.photo_image)) &&
            url && /fbcdn\.net|scontent|akamaihd/i.test(url) && !/emoji|static\.xx|icon|sprite/i.test(url);
        })
        .map((m, index) => {
          const url = m.url || m.previewUrl || m.photo_image?.url || m.photo_image?.uri;
          const mediaType = String(m.type || m.__typename || '').toLowerCase();
          const isVideoUrl = /\/v\/t15[./]|\/video|\.mp4(?:\?|$)|mime=video/i.test(url || '');
          const isVideo = mediaType === 'video' || (index === 0 && (isVideoAlert || isVideoUrl));
          return url ? {
            url,
            type: isVideo ? 'video' : 'image',
            poster: m.previewUrl || m.thumbnail || undefined,
          } : null;
        })
        .filter(Boolean);

      if (mediaItems.length === 0) {
        return null;
      }

      const currentMedia = mediaItems[carouselIndex] || mediaItems[0];
      const hasMultiple = mediaItems.length > 1;
      const isPlayableVideo = currentMedia.type === 'video' && /\.mp4(?:\?|$)|mime=video/i.test(currentMedia.url);

      return (
        <div className="mt-4 w-full">
          <div className="relative group rounded-xl overflow-hidden border border-border bg-gradient-to-b from-slate-50 to-white w-full">
            {currentMedia.type === 'video' && isPlayableVideo ? (
              <video
                controls
                src={currentMedia.url}
                poster={currentMedia.poster}
                className="w-full h-auto max-h-[500px] object-contain bg-black"
              />
            ) : currentMedia.type === 'video' && alert.url ? (
              <div className="w-full flex items-center justify-center py-2">
                <div className="w-full px-2 sm:px-0 flex justify-center max-h-[580px] overflow-hidden">
                  <div
                    className="fb-video"
                    data-href={alert.url}
                    data-width="500"
                    data-height="480"
                    data-show-text="false"
                  />
                </div>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt="Facebook media"
                className="w-full h-auto max-h-[500px] object-contain"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [carouselIndex]: true }));
                }}
              />
            )}

            {hasMultiple && (
              <>
                <button
                  onClick={() => setCarouselIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCarouselIndex(prev => (prev + 1) % mediaItems.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {carouselIndex + 1} / {mediaItems.length}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (isTikTok) {
      const isVideo = alert.postType === 'VIDEO' || alert.type === 'VIDEO';
      const isCarousel = alert.postType === 'CAROUSEL' || alert.type === 'CAROUSEL';

      if (isVideo && alert.videoUrl) {
        return (
          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-black w-full">
            <video
              controls
              poster={alert.displayUrl}
              className="w-full h-auto max-h-[500px] object-contain bg-black"
            >
              <source src={getProxiedImageUrl(alert.videoUrl, 'video')} type="video/mp4" />
            </video>
          </div>
        );
      }

      if (isCarousel && Array.isArray(alert.images) && alert.images.length > 0) {
        const imageUrls = alert.images.map(img => getProxiedImageUrl(img, 'image')).filter(Boolean);
        if (imageUrls.length === 0) return null;

        const currentImage = imageUrls[carouselIndex];

        return (
          <div className="mt-4 w-full">
            <div className="relative group rounded-xl overflow-hidden border border-border bg-black/5 w-full">
              <img
                src={currentImage}
                alt="TikTok media"
                className="w-full h-auto max-h-[500px] object-contain"
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [carouselIndex]: true }));
                }}
              />

              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setCarouselIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCarouselIndex(prev => (prev + 1) % imageUrls.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {carouselIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      if (alert.displayUrl) {
        return (
          <div className="mt-4 rounded-xl overflow-hidden border border-border bg-black/5 w-full">
            <img
              src={getProxiedImageUrl(alert.displayUrl, 'image')}
              alt="TikTok media"
              className="w-full h-auto max-h-[500px] object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        );
      }
    }

    return null;
  };

  const renderMedia = () => {
    if (isTwitter) {
      return renderTwitterMedia();
    }
    return renderOtherPlatformMedia();
  };

  // Get post URL for "View on Platform" link - FIXED for Twitter
  const getPostUrl = () => {
    // Try all possible URL fields
    if (alert.postUrl) return alert.postUrl;
    if (alert.url) return alert.url;
    if (alert.videoUrl) return alert.videoUrl;
    if (alert.link) return alert.link;
    if (alert.tweetUrl) return alert.tweetUrl;
    if (alert.tweetUrlHttps) return alert.tweetUrlHttps;
    if (alert.permalink) return alert.permalink;
    if (alert.permalinkUrl) return alert.permalinkUrl;
    
    // For Twitter, try to construct the URL
    if (isTwitter && alert.username && alert.tweetId) {
      return `https://twitter.com/${alert.username}/status/${alert.tweetId}`;
    }
    if (isTwitter && alert.username && alert.id) {
      return `https://twitter.com/${alert.username}/status/${alert.id}`;
    }
    
    // For Facebook, try to construct the URL
    if (platformKey === 'facebook' && alert.postId) {
      return `https://www.facebook.com/${alert.postId}`;
    }
    if (platformKey === 'facebook' && alert.id) {
      return `https://www.facebook.com/${alert.id}`;
    }
    
    // For Instagram, try to construct the URL
    if (platformKey === 'instagram' && alert.username && alert.mediaId) {
      return `https://www.instagram.com/p/${alert.mediaId}/`;
    }
    if (platformKey === 'instagram' && alert.shortcode) {
      return `https://www.instagram.com/p/${alert.shortcode}/`;
    }
    
    // For TikTok, try to construct the URL
    if (platformKey === 'tiktok' && alert.username && alert.videoId) {
      return `https://www.tiktok.com/@${alert.username}/video/${alert.videoId}`;
    }
    if (platformKey === 'tiktok' && alert.videoId) {
      return `https://www.tiktok.com/video/${alert.videoId}`;
    }
    
    return null;
  };

  const postUrl = getPostUrl();

  const hasEngagementMetrics =
    (isTwitter && [alert.replyCount, alert.retweetCount, alert.likeCount, alert.quoteCount].some((value) => Number(value) > 0)) ||
    (platformKey === "facebook" && [alert.reactions, alert.comments, alert.shares].some((value) => Number(value) > 0)) ||
    (platformKey === "instagram" && [alert.likesCount, alert.commentsCount].some((value) => Number(value) > 0)) ||
    (platformKey === "tiktok" && [alert.viewsCount, alert.likesCount, alert.commentsCount, alert.sharesCount].some((value) => Number(value) > 0)) ||
    (platformKey === "youtube" && [alert.views, alert.likes, alert.comments].some((value) => Number(value) > 0));

  // Get platform label for view link
  const getPlatformLabel = () => {
    switch(platformKey) {
      case 'youtube': return 'YouTube';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'twitter': return 'Twitter';
      default: return platformKey.charAt(0).toUpperCase() + platformKey.slice(1);
    }
  };

  // Get platform icon for view link
  const getPlatformIcon = () => {
    switch(platformKey) {
      case 'youtube': return <ExternalLink size={16} className="text-red-600" />;
      case 'facebook': return <ExternalLink size={16} className="text-blue-600" />;
      case 'instagram': return <ExternalLink size={16} className="text-pink-600" />;
      case 'tiktok': return <ExternalLink size={16} className="text-black" />;
      case 'twitter': return <ExternalLink size={16} className="text-blue-400" />;
      default: return <ExternalLink size={16} />;
    }
  };

  // Get platform color for view link
  const getViewLinkColor = () => {
    switch(platformKey) {
      case 'youtube': return 'text-red-600 hover:text-red-800';
      case 'facebook': return 'text-blue-600 hover:text-blue-800';
      case 'instagram': return 'text-pink-600 hover:text-pink-800';
      case 'tiktok': return 'text-black hover:text-slate-700';
      case 'twitter': return 'text-blue-400 hover:text-blue-600';
      default: return 'text-blue-600 hover:text-blue-800';
    }
  };

  // Get date/time display
  const getDateTimeDisplay = () => {
    if (eventTime) {
      const date = new Date(eventTime);
      return date.toLocaleString();
    }
    return 'No date available';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(`/alerts/${platform}`)}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-border rounded-lg hover:bg-slate-50 w-auto mb-4 sm:mb-6"
        >
          <ArrowLeft size={14} className="sm:w-4 sm:h-4 flex-shrink-0" /> 
          <span>Back to Alerts</span>
        </button>

        {/* Full Detail Card */}
        <div
          className={clsx(
            "bg-white border rounded-2xl p-4 sm:p-6 shadow-card w-full overflow-hidden",
            isViewed ? "border-border" : "border-blue-400/40"
          )}
        >
          {/* Header - User Info with View on Platform link on the right */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <img
                src={profileAvatar}
                alt={username || 'User'}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border border-border flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${username || 'User'}&background=${platformColor.replace('#', '')}&color=fff&size=128`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">
                    {displayName}
                  </span>
                  {username && (
                    <span className="text-slate-500 text-xs sm:text-sm">
                      @{username}
                    </span>
                  )}
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                    <Calendar size={12} className="sm:w-3 sm:h-3" />
                    {eventTime ? formatDistanceToNow(new Date(eventTime), { addSuffix: true }) : 'just now'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                  {/* Platform badge */}
                  <span className={clsx(
                    "text-[10px] sm:text-xs px-2 py-0.5 rounded-full border uppercase flex items-center gap-1",
                    ui.pill
                  )}>
                    {platformKey.charAt(0).toUpperCase() + platformKey.slice(1)}
                  </span>
                  {/* Post type badge */}
                  {isTwitter && postType && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 uppercase flex items-center gap-1">
                      {getPostTypeIcon()}
                      {getPostTypeLabel()}
                    </span>
                  )}
                  {!isTwitter && alert.postType && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 uppercase">
                      {alert.postType}
                    </span>
                  )}
                  {/* Viewed status */}
                  <span className={clsx(
                    "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold uppercase flex items-center gap-1",
                    isViewed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-400/30"
                      : "bg-amber-50 text-amber-700 border border-amber-400/30"
                  )}>
                    {isViewed ? <Eye size={12} /> : <EyeOff size={12} />}
                    {isViewed ? "Viewed" : "Unviewed"}
                  </span>
                </div>
              </div>
            </div>

            {/* View on Platform link - Right side */}
            {postUrl && (
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${getViewLinkColor()} transition-colors flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0`}
              >
              
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Content */}
          <div className="mt-4 p-3 sm:p-4 bg-slate-50 rounded-xl">
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>

          {/* YouTube Description */}
          {platformKey === "youtube" && alert.videoDescription && (
            <div className="mt-3 w-full">
              <p
                className={clsx(
                  "text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap",
                  !expandDescription ? "line-clamp-3" : ""
                )}
              >
                {alert.videoDescription}
              </p>
              {alert.videoDescription && alert.videoDescription.length > 150 && (
                <button
                  onClick={() => setExpandDescription(!expandDescription)}
                  className="mt-1 text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  {expandDescription ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}

          {/* Media */}
          <div className="mt-4 w-full">
            {renderMedia()}
          </div>

          {/* Engagement Metrics */}
          {hasEngagementMetrics && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-3 sm:pt-4 border-t border-border text-xs sm:text-sm text-slate-500">
            {/* Twitter metrics */}
            {isTwitter && (
              <>
                {alert.replyCount !== undefined && alert.replyCount > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} className="text-slate-400" />
                    {alert.replyCount.toLocaleString()} replies
                  </span>
                )}
                {alert.retweetCount !== undefined && alert.retweetCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Repeat2 size={14} className="text-green-600" />
                    {alert.retweetCount.toLocaleString()} retweets
                  </span>
                )}
                {alert.likeCount !== undefined && alert.likeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    {alert.likeCount.toLocaleString()} likes
                  </span>
                )}
                {alert.quoteCount !== undefined && alert.quoteCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Quote size={14} className="text-blue-600" />
                    {alert.quoteCount.toLocaleString()} quotes
                  </span>
                )}
              </>
            )}

            {/* Facebook metrics */}
            {platformKey === "facebook" && (
              <>
                {alert.reactions && alert.reactions > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    {alert.reactions.toLocaleString()} reactions
                  </span>
                )}
                {alert.comments && alert.comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} className="text-slate-400" />
                    {alert.comments.toLocaleString()} comments
                  </span>
                )}
                {alert.shares && alert.shares > 0 && (
                  <span className="flex items-center gap-1">
                    <Share2 size={14} className="text-slate-400" />
                    {alert.shares.toLocaleString()} shares
                  </span>
                )}
              </>
            )}

            {/* Instagram metrics */}
            {platformKey === "instagram" && (
              <>
                {alert.likesCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    {alert.likesCount.toLocaleString()} likes
                  </span>
                )}
                {alert.commentsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} className="text-slate-400" />
                    {alert.commentsCount.toLocaleString()} comments
                  </span>
                )}
              </>
            )}

            {/* TikTok metrics */}
            {platformKey === "tiktok" && (
              <>
                {alert.viewsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={14} className="text-slate-400" />
                    {alert.viewsCount.toLocaleString()} views
                  </span>
                )}
                {alert.likesCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    {alert.likesCount.toLocaleString()} likes
                  </span>
                )}
                {alert.commentsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} className="text-slate-400" />
                    {alert.commentsCount.toLocaleString()} comments
                  </span>
                )}
                {alert.sharesCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Share2 size={14} className="text-slate-400" />
                    {alert.sharesCount.toLocaleString()} shares
                  </span>
                )}
              </>
            )}

            {/* YouTube metrics */}
            {platformKey === "youtube" && (
              <>
                {alert.views && alert.views > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={14} className="text-slate-400" />
                    {alert.views.toLocaleString()} views
                  </span>
                )}
                {alert.likes && alert.likes > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-red-500" />
                    {alert.likes.toLocaleString()} likes
                  </span>
                )}
                {alert.comments && alert.comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} className="text-slate-400" />
                    {alert.comments.toLocaleString()} comments
                  </span>
                )}
              </>
            )}
          </div>
          )}

          {/* Footer with date/time */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 sm:pt-4 border-t border-border">
            <div className="text-xs text-slate-400">
              <Calendar size={12} className="inline mr-1" />
              {getDateTimeDisplay()}
            </div>
           
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AlertDetail;