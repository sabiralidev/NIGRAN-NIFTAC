import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstagramContent } from "../utils/instagramContent";
import { motion } from "framer-motion";
import {
  Image,
  Video,
  Quote,
  MessageSquare,
  FileText,
  Type,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  Repeat2,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Share2,
  Eye as EyeIcon,
  Youtube,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import { detectPostType } from "../utils/postTypeDetection";
import { detectTwitterPostType } from "../utils/twitterPostTypeDetection";
import { getProxiedImageUrl } from "../utils/imageProxy";
import {
  getInstagramVideoSource,
  getInstagramImageSource,
} from "../utils/instagram/mediaUtils";
import { normalizeProfileImageUrl } from "../utils/avatar";

const activityConfig = {
  tweet: { label: "Tweet", color: "badge-blue", icon: FileText },
  retweet: { label: "Retweet", color: "badge-green", icon: Repeat2 },
  reply: { label: "Reply", color: "badge-purple", icon: MessageSquare },
  image: { label: "Image", color: "badge-cyan", icon: Image },
  video: { label: "Video", color: "badge-orange", icon: Video },
  thread: { label: "Thread", color: "badge-yellow", icon: Layers },
  quote: { label: "Quote", color: "badge-red", icon: Quote },
  TEXT: { label: "Text", color: "badge-blue", icon: Type },
  IMAGE: { label: "Image", color: "badge-cyan", icon: Image },
  VIDEO: { label: "Video", color: "badge-orange", icon: Video },
  CAROUSEL: { label: "Carousel", color: "badge-purple", icon: FileText },
  TWEET: { label: "Tweet", color: "badge-blue", icon: FileText },
  RETWEET: { label: "Retweet", color: "badge-green", icon: Repeat2 },
  REPLY: { label: "Reply", color: "badge-purple", icon: MessageSquare },
  QUOTE: { label: "Quote", color: "badge-red", icon: Quote },
  THREAD: { label: "Thread", color: "badge-yellow", icon: Layers },
  UNKNOWN: { label: "Unknown", color: "badge-gray", icon: HelpCircle },
};

// Platform config for links
const platformLinkConfig = {
  youtube: { label: "View on YouTube", icon: Youtube, color: "text-red-600" },
  twitter: {
    label: "View on Twitter",
    icon: ExternalLink,
    color: "text-blue-600",
  },
  facebook: {
    label: "View on Facebook",
    icon: ExternalLink,
    color: "text-blue-700",
  },
  instagram: {
    label: "View on Instagram",
    icon: ExternalLink,
    color: "text-pink-600",
  },
  tiktok: { label: "View on TikTok", icon: ExternalLink, color: "text-black" },
};

// Resolves a single representative thumbnail image for the compact row card,
// per platform. Falls back to null (caller uses the profile avatar instead).
const getRowThumbnail = (platform, alert) => {
  if (!alert) return null;

  if (platform === "twitter") {
    if (alert.media && alert.media.length > 0) {
      const m = alert.media[0];
      return m.url || m.preview_image_url || m.image_url || null;
    }
    return null;
  }

  if (platform === "facebook") {
    if (alert.media && alert.media.length > 0) {
      const photo = alert.media.find((m) => {
        const url = m.url || m.previewUrl || m.photo_image?.url || m.photo_image?.uri;
        return url && /fbcdn\.net|scontent|akamaihd/i.test(url) && !/emoji|static\.xx|icon|sprite/i.test(url);
      });
      if (photo) {
        return photo.url || photo.previewUrl || photo.photo_image?.url || photo.photo_image?.uri || null;
      }
    }
    return null;
  }

  if (platform === "instagram") {
    let thumb =
      alert.displayUrl ||
      alert.url ||
      (Array.isArray(alert.images) && alert.images.length > 0
        ? typeof alert.images[0] === "string"
          ? alert.images[0]
          : alert.images[0]?.url
        : null);

    // Proxy Instagram CDN URLs through backend to bypass CORS
    if (
      thumb &&
      (thumb.includes("cdninstagram.com") ||
        thumb.includes("fbcdn.net") ||
        thumb.includes("fna.fbcdn"))
    ) {
      thumb = `http://${location.hostname}:5003/instagram/posts/proxy/image?url=${encodeURIComponent(thumb)}`;
    }

    if (alert._id && thumb) {
      console.log(
        `[AlertCard] Instagram ${alert._id}: proxied=${thumb.includes("localhost")}, url=${thumb.substring(0, 80)}`,
      );
    }
    return thumb;
  }

  if (platform === "tiktok") {
    if (alert.displayUrl) return getProxiedImageUrl(alert.displayUrl);
    if (Array.isArray(alert.images) && alert.images.length > 0)
      return getProxiedImageUrl(alert.images[0]);
    return null;
  }

  if (platform === "youtube") {
    if (alert.thumbnailUrl) return alert.thumbnailUrl;
    if (alert.thumbnails?.high?.url) return alert.thumbnails.high.url;
    if (alert.thumbnails?.default?.url) return alert.thumbnails.default.url;
    if (alert.thumbnail) return alert.thumbnail;
    return null;
  }

  return null;
};

const getAlertContent = (alert) => {
  const isInstagram = alert.platform?.toLowerCase() === "instagram";
  if (isInstagram) {
    return getInstagramContent(alert) || "No caption";
  }
  const candidates = [
    alert.content,
    alert.caption,
    alert.text,
    alert.fullText,
    alert.tweetText,
    alert.message,
    alert.quotedTweet?.text,
    alert.data?.content,
    alert.data?.text,
    alert.post?.content,
    alert.post?.text,
    alert.title,
  ];

  return candidates
    .find((value) => typeof value === "string" && value.trim())
    ?.replace(/\s*https?:\/\/t\.co\/\S+/gi, "")
    .replace(/\s*https?:\/\/www\.instagram\.com\/\S+/gi, "")
    .trim() || "No caption";
};

const AlertCard = ({
  alert,
  onMarkRead,
  onView,
  onDismiss,
  compact = false,
  variant = "full",
}) => {
  const navigate = useNavigate();

  // Safety check - if alert is undefined or null, return null
  if (!alert) {
    return null;
  }

  const [carouselIndex, setCarouselIndex] = useState(0);
  const platform = (alert.platform || "twitter").toLowerCase();

  // Determine post type and config based on platform
  let config;
  if (platform === "facebook") {
    const detectedPostType = detectPostType(alert.media, alert.postType);
    config = activityConfig[detectedPostType] || activityConfig.TEXT;
  } else if (platform === "instagram") {
    const instagramTypeMap = {
      Image: "IMAGE",
      Video: "VIDEO",
      Carousel: "CAROUSEL",
    };
    const detectedPostType = instagramTypeMap[alert.type] || "UNKNOWN";
    config = activityConfig[detectedPostType] || activityConfig.IMAGE;
  } else if (platform === "tiktok") {
    const detectedPostType = String(
      alert.postType || (alert.isSlideshow ? "CAROUSEL" : "VIDEO"),
    ).toUpperCase();
    config = activityConfig[detectedPostType] || activityConfig.VIDEO;
  } else if (platform === "twitter") {
    const detectedPostType = detectTwitterPostType(
      alert.activityType,
      alert.media,
      alert.content,
    );
    config = activityConfig[detectedPostType] || activityConfig.TWEET;
  } else if (platform === "youtube") {
    config = activityConfig.VIDEO;
  } else {
    config = activityConfig[alert.activityType] || activityConfig.tweet;
  }

  const ActivityIcon = config.icon;
  const isViewed =
    typeof alert.isViewed === "boolean" ? alert.isViewed : !!alert.isRead;

  const timeAgo = formatDistanceToNow(
    new Date(
      alert.createdAt ||
        alert.tweetCreatedAt ||
        alert.timestamp ||
        alert.publishedAt ||
        Date.now(),
    ),
    {
      addSuffix: true,
    },
  );

  const fullDateTime = new Date(
    alert.createdAt ||
      alert.tweetCreatedAt ||
      alert.timestamp ||
      alert.publishedAt ||
      Date.now(),
  ).toLocaleString();

  const statusLabel = isViewed ? "Viewed" : "Unviewed";

  const profileAvatar =
    normalizeProfileImageUrl(
      (platform === "youtube" && alert.channelProfileImage) ||
        alert.profilePic ||
        alert.profileImage ||
        alert.authorProfilePic ||
        alert.authorAvatar ||
        alert.channelThumbnail,
    ) ||
    normalizeProfileImageUrl(alert.displayUrl) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
      alert.username || alert.authorUsername || alert.channelName || "user"
    }`;

  // Get the platform URL for the post
  const getPostUrl = () => {
    if (alert.postUrl) return alert.postUrl;
    if (alert.url) return alert.url;
    if (alert.videoUrl) return alert.videoUrl;
    if (alert.link) return alert.link;
    return null;
  };

  const postUrl = getPostUrl();
  const linkConfig = platformLinkConfig[platform] || platformLinkConfig.twitter;

  // Comprehensive metrics extraction
  const getMetrics = () => {
    const sources = [
      alert,
      alert.stats,
      alert.metrics,
      alert.engagement,
      alert.insights,
      alert.data,
    ];

    let views = 0,
      likes = 0,
      comments = 0,
      shares = 0;

    const viewFields = [
      "viewsCount",
      "views",
      "viewCount",
      "view_count",
      "plays",
      "playCount",
      "play_count",
    ];
    const likeFields = [
      "likesCount",
      "likes",
      "likeCount",
      "like_count",
      "hearts",
      "favorites",
    ];
    const commentFields = [
      "commentsCount",
      "comments",
      "commentCount",
      "comment_count",
    ];
    const shareFields = [
      "sharesCount",
      "shares",
      "shareCount",
      "share_count",
      "retweets",
      "reposts",
    ];

    sources.forEach((source) => {
      if (!source) return;

      viewFields.forEach((field) => {
        if (source[field] !== undefined && source[field] !== null) {
          views = Math.max(views, parseInt(source[field]) || 0);
        }
      });

      likeFields.forEach((field) => {
        if (source[field] !== undefined && source[field] !== null) {
          likes = Math.max(likes, parseInt(source[field]) || 0);
        }
      });

      commentFields.forEach((field) => {
        if (source[field] !== undefined && source[field] !== null) {
          comments = Math.max(comments, parseInt(source[field]) || 0);
        }
      });

      shareFields.forEach((field) => {
        if (source[field] !== undefined && source[field] !== null) {
          shares = Math.max(shares, parseInt(source[field]) || 0);
        }
      });
    });

    return { views, likes, comments, shares };
  };

  // ---- Compact row layout ----
  if (
    variant === "compact" &&
    ["twitter", "facebook", "instagram", "tiktok", "youtube"].includes(platform)
  ) {
    const rowThumbnail = getRowThumbnail(platform, alert);
    if (platform === "instagram" && rowThumbnail) {
      console.log(
        `[AlertCard] Rendering Instagram thumbnail:`,
        rowThumbnail.substring(0, 100),
      );
    }

    const headline = getAlertContent(alert);

    const sourceLabel =
      alert.displayName ||
      alert.authorDisplayName ||
      alert.source ||
      alert.username ||
      alert.channelName;

    const metrics = getMetrics();
    const hasMetrics =
      metrics.views > 0 ||
      metrics.likes > 0 ||
      metrics.comments > 0 ||
      metrics.shares > 0;

    const isYouTube = platform === "youtube";
    const channelName =
      alert.channelName ||
      alert.authorDisplayName ||
      alert.displayName ||
      alert.source;
    const videoTitle = alert.title || getAlertContent(alert);
    const ViewIcon = linkConfig.icon;

    // Handle click - navigate to detail page
    const handleCardClick = () => {
      if (onView) {
        onView();
      } else {
        // Navigate to detail page using the platform and alert ID
        navigate(`/alerts/${platform}/${alert._id}`);
      }
    };

    // Determine if we should show "View Details" or "View on Platform"
    // For YouTube, show "View on YouTube" directly
    // For other platforms, show "View Details"
    const isYouTubePlatform = platform === "youtube";

    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          opacity: { duration: 0.15 },
        }}
        style={{ willChange: "transform, opacity" }}
        className={clsx(
          "bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 hover:border-slate-300 hover:shadow-lg cursor-pointer group",
          isViewed ? "border-border" : "border-red-400/40",
        )}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className="w-full sm:w-40 h-40 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
          <img
            src={rowThumbnail || profileAvatar}
            alt="Post media or profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails and we haven't tried the fallback yet, try profileAvatar
              if (rowThumbnail && e.target.src !== profileAvatar) {
                e.target.src = profileAvatar;
              } else if (!profileAvatar) {
                // If no fallback available, hide the image
                e.target.style.display = "none";
              }
            }}
          />
          {isYouTube && rowThumbnail && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-600/90 rounded-full p-2">
                <Youtube size={24} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* TOP: Username, badges, date/time */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-sm">
                  {isYouTube ? channelName : sourceLabel}
                </span>
                <span className={clsx("badge text-[10px]", config.color)}>
                  <ActivityIcon size={10} />
                  {config.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-400/30 text-red-700 uppercase flex items-center gap-1">
                  {isYouTube ? <Youtube size={10} /> : null}
                  {platform.toUpperCase()}
                </span>
                <span
                  className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide",
                    isViewed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-400/30"
                      : "bg-red-600 text-white",
                  )}
                >
                  {statusLabel}
                </span>
                {isYouTube && alert.priority && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-400/30 uppercase">
                    {alert.priority}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {timeAgo} · {fullDateTime}
              </p>
            </div>
          </div>

          {/* MIDDLE: Caption/Content / Video Title */}
          <p className="text-sm text-slate-700 mt-2 leading-relaxed line-clamp-2">
            {isYouTube ? videoTitle : headline}
          </p>

          {/* Engagement Metrics with Icons */}
          {hasMetrics && (
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
              {metrics.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <EyeIcon size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {metrics.views.toLocaleString()}
                  </span>
                  <span>views</span>
                </span>
              )}
              {metrics.likes > 0 && (
                <span className="flex items-center gap-1.5">
                  <Heart size={14} className="text-red-500" />
                  <span className="font-medium text-slate-700">
                    {metrics.likes.toLocaleString()}
                  </span>
                  <span>likes</span>
                </span>
              )}
              {metrics.comments > 0 && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {metrics.comments.toLocaleString()}
                  </span>
                  <span>comments</span>
                </span>
              )}
              {metrics.shares > 0 && (
                <span className="flex items-center gap-1.5">
                  <Share2 size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {metrics.shares.toLocaleString()}
                  </span>
                  <span>shares</span>
                </span>
              )}
            </div>
          )}

          {/* BOTTOM: Action buttons */}
          <div className="mt-auto flex items-center gap-4 pt-3 border-t border-slate-100">
            {isYouTubePlatform && postUrl ? (
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${linkConfig.color} text-xs font-semibold hover:underline flex items-center gap-1`}
              >
                <ViewIcon size={14} />
                {linkConfig.label}
              </a>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onView) {
                    onView();
                  } else {
                    navigate(`/alerts/${platform}/${alert._id}`);
                  }
                }}
                className="text-blue-600 text-xs font-semibold hover:underline"
              >
                View Details
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert._id);
                }}
                className="text-slate-500 text-xs font-semibold hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ---- Full layout ----
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        opacity: { duration: 0.15 },
      }}
      style={{ willChange: "transform, opacity" }}
      className={clsx(
        "bg-white border p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-lg cursor-pointer group rounded-xl",
        isViewed ? "border-border" : "border-blue-400/40",
      )}
      onClick={() => {
        if (onView) {
          onView();
        } else {
          navigate(`/alerts/${platform}/${alert._id}`);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={profileAvatar}
            alt={alert.username || alert.authorUsername || alert.channelName}
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
          <div
            className={clsx(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
              config.color.replace("badge-", "bg-").replace("badge", "bg") +
                "/10" || "bg-blue-500/10",
            )}
          >
            <ActivityIcon size={10} className="text-slate-700" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">
              {alert.displayName ||
                alert.authorDisplayName ||
                alert.source ||
                alert.username ||
                alert.channelName}
            </span>
            {(alert.username || alert.authorUsername) && (
              <span className="text-slate-500 text-xs">
                @{alert.username || alert.authorUsername}
              </span>
            )}
            <span className={clsx("badge text-[10px]", config.color)}>
              <ActivityIcon size={10} />
              {config.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-400/30 text-cyan-700 uppercase">
              {platform}
            </span>
            {!isViewed && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 animate-pulse" />
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-700 font-semibold flex items-center gap-1">
                  <EyeOff size={10} />
                  Unviewed
                </span>
              </div>
            )}
            {isViewed && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-700 flex items-center gap-1">
                <Eye size={10} />
                Viewed
              </span>
            )}
          </div>

          {getAlertContent(alert) !== "No caption" && (
            <p
              className={clsx(
                "text-slate-700 text-sm mt-1.5 leading-relaxed",
                compact ? "line-clamp-2" : "line-clamp-4",
              )}
            >
              {getAlertContent(alert)}
            </p>
          )}

          {/* Footer with View Details or View on Platform */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1"></div>
            <div className="flex items-center gap-3">
              {platform === "youtube" && postUrl ? (
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 transition-colors"
                >
                  <Youtube size={12} />
                  View on YouTube
                </a>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onView) {
                      onView();
                    } else {
                      navigate(`/alerts/${platform}/${alert._id}`);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={12} />
                  View Details
                </button>
              )}
              <span className="text-slate-600 text-xs">{fullDateTime}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertCard;
