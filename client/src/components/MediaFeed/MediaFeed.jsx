import { Play, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatCount } from "../../services/realtimeService";
import { getPlatformUrl } from "../../utils/platformUrls";

const DEMO_FEED = [
  {
    _id: "df1",
    title: "Identity Collapse: The Psychology of Terrorist Recruitment",
    channel: "The Black Signal 2",
    views: "6h ago",
    thumbnailUrl: "",
    postUrl: "#",
    platform: "youtube",
  },
  {
    _id: "df2",
    title:
      "Operation Ghazab-ul-Haq: Pakistan's Military Response to Cross-Border Terrorism",
    channel: "SunoFM895.4",
    views: "9h ago",
    thumbnailUrl: "",
    postUrl: "#",
    platform: "youtube",
  },
  {
    _id: "df3",
    title:
      "Kash Patel Fired All of the FBI Counter Terrorism Experts That Kept Us Safe From Iran",
    channel: "Hawk's Podcasts / motgr0s58hawk",
    views: "6h ago",
    thumbnailUrl: "",
    postUrl: "#",
    platform: "youtube",
  },
];

const ThumbnailPlaceholder = ({ title, platform }) => (
  <div
    className="flex items-center justify-center flex-shrink-0"
    style={{
      width: 90,
      height: 64,
      background: "#f1f5f9",
      border: "1px solid #e2e8f0",
      position: "relative",
    }}
  >
    <Play size={18} color="#6b7280" />
    <div
      className="absolute bottom-0 right-0 px-1 py-0.5 text-[9px]"
      style={{ background: "#ef4444", color: "#fff", fontWeight: 700 }}
    >
      {platform?.toUpperCase() || "VID"}
    </div>
  </div>
);

const MediaCard = ({ item }) => {
  const externalUrl = item.postUrl || getPlatformUrl(item);

  return (
    <div className="media-card mb-2">
      <div className="flex items-start gap-3 p-3">
        {/* Display actual media or placeholder */}
        {item.media && item.media.length > 0 ? (
          <div
            className="flex-shrink-0 relative rounded overflow-hidden group"
            style={{ width: 90, height: 64 }}
          >
            {item.media[0].type === "video" ||
            item.media[0].type === "animated_gif" ? (
              <>
                <img
                  src={item.media[0].previewUrl || item.media[0].url}
                  alt="media preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <Play size={16} className="text-white opacity-75" />
                </div>
              </>
            ) : (
              <img
                src={item.media[0].url || item.media[0].previewUrl}
                alt="media"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            {item.media.length > 1 && (
              <div className="absolute top-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[9px] text-white font-bold">
                +{item.media.length - 1}
              </div>
            )}
          </div>
        ) : (
          <ThumbnailPlaceholder title={item.title} platform={item.platform} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-relaxed">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-500 truncate">
              {item.channel}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-600">{item.views}</span>
            {externalUrl && externalUrl !== "#" && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-400"
              >
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MediaFeed = ({ items = [], loading, platform }) => {
  const feed = items.length > 0 ? items : DEMO_FEED;

  return (
    <div style={{ height: "100%" }}>
      <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="media-card mb-2 p-3 animate-pulse">
                <div className="flex gap-3">
                  <div
                    style={{ width: 90, height: 64, background: "#e2e8f0" }}
                  />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 w-full mb-1" />
                    <div className="h-3 bg-slate-100 w-2/3" />
                  </div>
                </div>
              </div>
            ))
          : feed.map((item, i) => (
              <MediaCard key={item._id || i} item={item} />
            ))}
      </div>
    </div>
  );
};

export default MediaFeed;
