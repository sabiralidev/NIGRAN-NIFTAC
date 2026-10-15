/**
 * Resolve Instagram alert media URLs (thumbnail vs video file).
 */

export const isVideoFileUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(lower) ||
    lower.includes("/video/") ||
    lower.includes("video_mp4")
  );
};

/** MP4 (or other video) URL for playback / download */
export const getInstagramVideoSource = (alert) => {
  if (!alert) return null;
  const candidates = [alert.videoUrl, alert.displayUrl, alert.url];
  return candidates.find((url) => url && isVideoFileUrl(url)) || null;
};

/** JPEG/thumbnail URL for poster / image display */
export const getInstagramImageSource = (alert) => {
  if (!alert) return null;
  const candidates = [alert.displayUrl, alert.thumbnailUrl];
  return candidates.find((url) => url && !isVideoFileUrl(url)) || null;
};
