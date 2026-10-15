/**
 * Detects the post type based on media content and stored postType field
 * @param {Array} media - The media array from the post/alert
 * @param {String} postType - The stored postType field (can be 'TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'UNKNOWN')
 * @returns {String} - One of: TEXT, IMAGE, VIDEO, CAROUSEL, UNKNOWN
 */
export const detectPostType = (media, postType) => {
  // Use stored postType if it's a clear type indicator
  if (postType && postType !== "UNKNOWN" && postType !== "TEXT") {
    return postType;
  }

  // If no media, it's a text post
  if (!media || media.length === 0) {
    return "TEXT";
  }

  // Check media types
  const hasVideo = media.some(
    (m) => m.__typename === "Video" || m.type === "VIDEO" || m.video
  );
  const hasPhoto = media.some(
    (m) =>
      m.__typename === "Photo" ||
      m.type === "IMAGE" ||
      m.photo_image ||
      m.thumbnail
  );

  // If multiple media items, it's a carousel
  if (media.length > 1 && (hasVideo || hasPhoto)) {
    return "CAROUSEL";
  } else if (hasVideo) {
    return "VIDEO";
  } else if (hasPhoto) {
    return "IMAGE";
  }

  // Default to stored postType or TEXT
  return postType && postType !== "UNKNOWN" ? postType : "TEXT";
};

/**
 * Post type configuration with labels, icons, and colors
 */
export const postTypeConfig = {
  TEXT: { label: "Text", icon: "Type", color: "blue" },
  IMAGE: { label: "Image", icon: "Image", color: "cyan" },
  VIDEO: { label: "Video", icon: "Video", color: "orange" },
  CAROUSEL: { label: "Carousel", icon: "Layers", color: "purple" },
  UNKNOWN: { label: "Unknown", icon: "HelpCircle", color: "gray" },
};

/**
 * Gets the configuration for a specific post type
 * @param {String} postType - The post type
 * @returns {Object} - Configuration object with label, icon, and color
 */
export const getPostTypeConfig = (postType) => {
  return postTypeConfig[postType] || postTypeConfig.UNKNOWN;
};
