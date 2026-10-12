import React from "react";
import { Video } from "lucide-react";

const FacebookPostCard = ({ post }) => {
  // Handle media rendering based on type
  const renderMedia = () => {
    if (!post.media) return null;

    const mediaArray = Array.isArray(post.media) ? post.media : [post.media];

    return (
      <div className="grid grid-cols-1 gap-3 mb-4">
        {mediaArray.map((m, idx) => {
          const isVideo = m.__typename === "Video" || m.video;
          const isPhoto = m.__typename === "Photo" || m.photo_image || !m.video;

          if (isVideo && m.video) {
            const videoUrl = m.video?.url;
            const thumbnailUrl =
              m.thumbnail_image?.url || m.video?.preview_image?.url;

            if (!videoUrl) return null;

            return (
              <div
                key={`video-${idx}`}
                className="rounded-lg overflow-hidden border border-border bg-slate-100 group relative"
              >
                <div
                  className="relative w-full bg-black flex items-center justify-center"
                  style={{ height: "300px" }}
                >
                  <video
                    controls
                    className="w-full h-full object-cover"
                    poster={thumbnailUrl}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video size={48} className="text-white drop-shadow-lg" />
                  </div>
                </div>
              </div>
            );
          }

          if (isPhoto) {
            const imageUrl =
              m.photo_image?.url || m.thumbnail || m.url || m.previewUrl;
            if (!imageUrl) return null;

            return (
              <div
                key={`photo-${idx}`}
                className="rounded-lg overflow-hidden border border-border bg-slate-100"
              >
                <img
                  src={imageUrl}
                  alt="Post media"
                  className="rounded-lg w-full object-cover"
                  onError={(e) => {
                    e.target.src = "";
                  }}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mb-4 border border-border">
      <div className="flex items-center mb-4">
        {post.profilePic && (
          <img
            src={post.profilePic}
            alt="Profile"
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        )}
        <div>
          <div className="font-bold text-slate-900">
            {post.source || "Facebook Post"}
          </div>
          {post.displayName && (
            <p className="text-xs text-slate-400">{post.displayName}</p>
          )}
        </div>
      </div>
      <p className="text-slate-700 mb-4 whitespace-pre-wrap">
        {post.content || post.postText}
      </p>

      {renderMedia()}

      <div className="flex justify-between text-slate-400 text-sm mb-3 tabular-nums">
        <div>❤️ {post.likes || 0}</div>
        <div>💬 {post.comments || 0}</div>
        <div>↗️ {post.shares || 0}</div>
      </div>
      <div className="mt-2">
        <a
          href={post.url || post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
        >
          View on Facebook
        </a>
      </div>
    </div>
  );
};

export default FacebookPostCard;
