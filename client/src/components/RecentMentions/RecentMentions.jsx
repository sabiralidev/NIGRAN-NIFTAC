import { formatDistanceToNow } from "date-fns";
import {
  FaTwitter,
  FaFacebook,
  FaYoutube,
  FaInstagram,
  FaTelegram,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import { ExternalLink, Video, Image as ImageIcon, FileText, Grid3x3 } from "lucide-react";
import { getPlatformUrl } from "../../utils/platformUrls";
import { getProxiedImageUrl } from "../../utils/imageProxy";
import AvatarImage from "../AvatarImage";

const PLATFORM_ICONS = {
  twitter: { Icon: FaTwitter, color: "#1DA1F2" },
  facebook: { Icon: FaFacebook, color: "#1877F2" },
  youtube: { Icon: FaYoutube, color: "#FF0000" },
  instagram: { Icon: FaInstagram, color: "#E1306C" },
  tiktok: { Icon: SiTiktok, color: "#FFFFFF" },
  telegram: { Icon: FaTelegram, color: "#2CA5E0" },
};

// Post type colors and configurations
const POST_TYPE_STYLES = {
  TEXT: { color: "#60a5fa", bg: "#60a5fa20", icon: FileText, label: "Text" },
  IMAGE: { color: "#ec4899", bg: "#ec489920", icon: ImageIcon, label: "Image" },
  VIDEO: { color: "#f97316", bg: "#f9731620", icon: Video, label: "Video" },
  CAROUSEL: { color: "#8b5cf6", bg: "#8b5cf620", icon: Grid3x3, label: "Carousel" },
  TWEET: { color: "#1DA1F2", bg: "#1DA1F220", icon: FileText, label: "Tweet" },
  RETWEET: { color: "#10b981", bg: "#10b98120", icon: FileText, label: "Retweet" },
  REPLY: { color: "#06b6d4", bg: "#06b6d420", icon: FileText, label: "Reply" },
  QUOTE: { color: "#a855f7", bg: "#a855f720", icon: FileText, label: "Quote" },
  THREAD: { color: "#f59e0b", bg: "#f59e0b20", icon: Grid3x3, label: "Thread" },
  UNKNOWN: { color: "#64748b", bg: "#64748b20", icon: FileText, label: "Post" },
};

const getPostTypeStyle = (postType) => {
  if (!postType) return POST_TYPE_STYLES.UNKNOWN;
  const upperType = postType.toUpperCase();
  return POST_TYPE_STYLES[upperType] || POST_TYPE_STYLES.UNKNOWN;
};

const isVideoMediaType = (type) =>
  type === "video" || type === "animated_gif" || type === "Video";

const isVideoFileUrl = (url) =>
  typeof url === "string" &&
  (/\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url) ||
    url.toLowerCase().includes("/video/"));

const MentionItem = ({ mention }) => {
  const externalUrl = mention.postUrl || getPlatformUrl(mention);
  const fallbackLabel = (mention.authorUsername || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const platform = mention.platform?.toLowerCase() || 'unknown';
  const platformIcon = PLATFORM_ICONS[platform];
  const postTypeStyle = getPostTypeStyle(mention.postType);
  const IconComponent = postTypeStyle.icon;

  return (
    <div className="mention-item">
      <div className="flex items-start gap-2">
        {/* User Profile Image */}
        <AvatarImage
          src={mention.profilePic || mention.authorAvatar}
          alt={`${mention.authorUsername} profile image`}
          size="sm"
          fallbackLabel={fallbackLabel}
          className="flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <div className="flex flex-col leading-tight flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-900">
                {mention.authorDisplayName || mention.authorUsername || 'Unknown'}
              </span>
              <span className="text-[10px] text-slate-500">
                @{mention.authorUsername || mention.authorDisplayName || 'unknown'}
              </span>
            </div>
            {platformIcon && (
              <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded text-[9px]" 
                   style={{ background: platformIcon.color + "20" }}>
                <platformIcon.Icon size={10} style={{ color: platformIcon.color, display: "block" }} />
                <span className="font-medium" style={{ color: platformIcon.color }}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
            {mention.content || "No content available"}
          </p>
          
          {/* Media preview - Display as small thumbnails */}
          {mention.media && mention.media.length > 0 && (
            <div
              className="mt-2 flex gap-1.5 flex-wrap"
              style={{ marginBottom: '6px' }}
            >
              {mention.media.slice(0, 4).map((m, i) => {
                const mediaType = m?.type || "image";
                const isVideo = isVideoMediaType(mediaType);
                const safePreview =
                  m?.previewUrl && !isVideoFileUrl(m.previewUrl)
                    ? m.previewUrl
                    : null;
                const safeImageUrl =
                  m?.url && !isVideoFileUrl(m.url) ? m.url : null;
                const thumbnailUrl = safePreview || safeImageUrl;
                const rawVideoSrc =
                  m?.videoSrc || (isVideoFileUrl(m?.url) ? m.url : null);
                const needsVideoPreview =
                  m?.useVideoPreview || (isVideo && !thumbnailUrl && rawVideoSrc);
                const videoPreviewUrl = needsVideoPreview
                  ? getProxiedImageUrl(rawVideoSrc, "video") || rawVideoSrc
                  : null;

                if (!thumbnailUrl && !videoPreviewUrl) return null;

                return (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-xl border border-border bg-slate-100 group cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ width: '60px', height: '60px', minWidth: '60px' }}
                  >
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={`Post media ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (
                            m?.previewUrl &&
                            e.target.src !== m.previewUrl &&
                            !isVideoFileUrl(m.previewUrl)
                          ) {
                            e.target.src = m.previewUrl;
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    ) : (
                      <video
                        src={videoPreviewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Video badge */}
                    {isVideo ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 group-hover:bg-slate-900/45 transition-colors">
                        <Video size={12} className="text-white" />
                      </div>
                    ) : null}
                    
                    {/* +N more indicator */}
                    {mention.media.length > 4 && i === 3 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">
                          +{mention.media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Post type indicator */}
          {mention.postType && (
            <div className="flex items-center gap-1 flex-wrap">
              <div className="text-[9px] font-medium px-2 py-1 rounded inline-flex items-center gap-1" 
                   style={{ color: postTypeStyle.color, background: postTypeStyle.bg }}>
                <IconComponent size={10} />
                <span>{postTypeStyle.label}</span>
              </div>
            </div>
          )}
        </div>
        {externalUrl && externalUrl !== "#" && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-slate-500 hover:text-slate-700 transition-colors"
            title="Open original post"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
};

const RecentMentions = ({ mentions = [], loading }) => {
  return (
    <div style={{ height: "100%" }}>
      <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mention-item animate-pulse">
              <div className="mb-2 h-3 w-2/3 rounded-full bg-slate-100" />
              <div className="h-3 w-full rounded-full bg-slate-100" />
            </div>
          ))
        ) : mentions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50 py-8 text-center text-sm text-slate-500">
            No recent mentions
          </div>
        ) : (
          mentions.map((m, i) => <MentionItem key={m._id || i} mention={m} />)
        )}
      </div>
    </div>
  );
};

export default RecentMentions;
