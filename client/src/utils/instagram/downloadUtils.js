/**
 * Instagram Download Utilities
 * Handles downloading various Instagram post types with proper file naming and error handling
 */

/**
 * Generate a filename based on post metadata
 * @param {Object} alert - The Instagram alert object
 * @param {number} index - Index for carousel items (optional)
 * @param {string} extension - File extension (jpg, mp4, etc.)
 * @returns {string} - Generated filename
 */
export const generateFileName = (alert, index = null, extension = "jpg") => {
  const timestamp = new Date(alert.createdAt || alert.timestamp).toISOString().split("T")[0];
  const username = alert.authorUsername || alert.source || "instagram";
  const baseFileName = `${username}_${timestamp}`;

  if (index !== null) {
    return `${baseFileName}_${index + 1}.${extension}`;
  }

  return `${baseFileName}.${extension}`;
};

/**
 * Download a single file from a URL
 * @param {string} url - The URL to download from
 * @param {string} fileName - The name for the downloaded file
 * @param {function} onProgress - Optional callback for progress updates
 */
export const downloadFile = async (url, fileName, onProgress = null) => {
  try {
    console.log(`[Download] Starting download from: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Download] HTTP error! status: ${response.status}`, response.statusText);
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Track download progress if callback is provided
    const contentLength = response.headers.get("content-length");
    let downloadedLength = 0;

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      downloadedLength += value.length;

      if (onProgress && contentLength) {
        const progress = Math.round((downloadedLength / contentLength) * 100);
        onProgress(progress);
      }
    }

    // Create blob from chunks
    const blob = new Blob(chunks);

    if (blob.size === 0) {
      console.error(`[Download] Blob size is 0 for file: ${fileName}`);
      throw new Error("Downloaded file is empty");
    }

    console.log(`[Download] Successfully fetched ${blob.size} bytes for: ${fileName}`);

    // Create download link
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    
    console.log(`[Download] Triggering download for: ${fileName}`);
    link.click();
    
    document.body.removeChild(link);
    
    // Wait a bit before revoking to ensure browser processes the download
    await new Promise((resolve) => setTimeout(resolve, 100));
    URL.revokeObjectURL(downloadUrl);

    console.log(`[Download] Download completed for: ${fileName}`);
    return { success: true, fileName };
  } catch (error) {
    console.error(`[Download] Download failed for ${fileName}:`, error);
    throw error;
  }
};

/**
 * Download a single image from Instagram post
 * @param {string} imageUrl - The image URL (can be proxied or direct)
 * @param {Object} alert - The Instagram alert object for naming
 * @param {number} index - Index for carousel items (optional)
 */
export const downloadSingleImage = async (imageUrl, alert, index = null) => {
  if (!imageUrl) {
    throw new Error("No image URL provided");
  }

  const fileName = generateFileName(alert, index, "jpg");

  try {
    await downloadFile(imageUrl, fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error("Failed to download single image:", error);
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

/**
 * Download all images from a carousel post as separate files
 * @param {Array} imageUrls - Array of image URLs
 * @param {Object} alert - The Instagram alert object for naming
 */
export const downloadCarouselImages = async (imageUrls, alert) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error("No carousel images provided");
  }

  // Filter out null/empty URLs
  const validUrls = imageUrls.filter((url) => url && url.trim().length > 0);

  if (validUrls.length === 0) {
    throw new Error("No valid carousel image URLs provided");
  }

  console.log(`[Carousel Download] Starting download of ${validUrls.length} images`);

  const results = [];
  const errors = [];

  for (let i = 0; i < validUrls.length; i++) {
    try {
      console.log(`[Carousel Download] Processing image ${i + 1}/${validUrls.length}`);
      const fileName = generateFileName(alert, i, "jpg");
      await downloadFile(validUrls[i], fileName);
      results.push({ success: true, fileName, index: i });
      console.log(`[Carousel Download] Successfully downloaded image ${i + 1}: ${fileName}`);

      // Add delay between downloads (increased from 300ms to 600ms for reliability)
      if (i < validUrls.length - 1) {
        console.log(`[Carousel Download] Waiting before next download...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (error) {
      console.error(`[Carousel Download] Failed to download image ${i + 1}:`, error.message);
      errors.push({
        success: false,
        index: i,
        error: error.message,
        url: validUrls[i].substring(0, 100),
      });
    }
  }

  console.log(`[Carousel Download] Complete: ${results.length} succeeded, ${errors.length} failed`);

  return {
    success: errors.length === 0,
    downloaded: results,
    failed: errors,
    total: validUrls.length,
  };
};

/**
 * Download a video file from Instagram post
 * @param {string} videoUrl - The video URL
 * @param {Object} alert - The Instagram alert object for naming
 * @param {function} onProgress - Optional callback for progress updates
 */
export const downloadVideo = async (videoUrl, alert, onProgress = null) => {
  if (!videoUrl) {
    throw new Error("No video URL provided");
  }

  const fileName = generateFileName(alert, null, "mp4");

  try {
    await downloadFile(videoUrl, fileName, onProgress);
    return { success: true, fileName };
  } catch (error) {
    console.error("Failed to download video:", error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
};

/**
 * Determine the appropriate download action based on post type and media
 * @param {Object} alert - The Instagram alert object
 * @returns {Object} - Download action information
 */
export const getDownloadAction = (alert) => {
  const postType = (alert.postType || alert.type || "TEXT").toUpperCase();

  // CAROUSEL: Multiple items (images/videos)
  if (postType === "CAROUSEL") {
    // For carousel, use images array
    if (Array.isArray(alert.images) && alert.images.length > 0) {
      return {
        type: "carousel",
        mediaCount: alert.images.length,
        action: "downloadCarousel",
      };
    }
  }

  // VIDEO: Single video file
  if (postType === "VIDEO" && alert.displayUrl) {
    return {
      type: "video",
      mediaCount: 1,
      action: "downloadVideo",
    };
  }

  // REEL: Single reel (treat as video)
  if ((postType === "REEL" || postType === "REELS") && alert.displayUrl) {
    return {
      type: "video",
      mediaCount: 1,
      action: "downloadVideo",
    };
  }

  // IMAGE: Single image
  if (postType === "IMAGE" && alert.displayUrl) {
    return {
      type: "image",
      mediaCount: 1,
      action: "downloadImage",
    };
  }

  // Fallback: if has multiple images in array, treat as carousel
  if (Array.isArray(alert.images) && alert.images.length > 1) {
    return {
      type: "carousel",
      mediaCount: alert.images.length,
      action: "downloadCarousel",
    };
  }

  // Fallback: if has single displayUrl, check if it's a video URL
  if (alert.displayUrl) {
    const isVideoUrl =
      alert.displayUrl.includes(".mp4") ||
      alert.displayUrl.includes("video") ||
      alert.displayUrl.includes("reel") ||
      alert.type === "Video" ||
      alert.postType === "VIDEO";

    if (isVideoUrl) {
      return {
        type: "video",
        mediaCount: 1,
        action: "downloadVideo",
      };
    }

    return {
      type: "image",
      mediaCount: 1,
      action: "downloadImage",
    };
  }

  return {
    type: "unknown",
    mediaCount: 0,
    action: null,
  };
};

/**
 * Format download action label for UI
 * @param {string} postType - The post type
 * @param {number} mediaCount - Number of media items
 * @returns {string} - Formatted label
 */
export const formatDownloadLabel = (postType, mediaCount = 1) => {
  switch (postType) {
    case "image":
      return "Download Image";
    case "video":
      return "Download Video";
    case "carousel":
      return `Download All (${mediaCount})`;
    default:
      return "Download";
  }
};

/**
 * Format post type for display
 * @param {string} postType - The post type
 * @returns {string} - Formatted post type
 */
export const formatPostType = (postType) => {
  const type = postType || "Unknown";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};
