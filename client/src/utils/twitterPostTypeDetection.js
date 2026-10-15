/**
 * Detects the post type for Twitter/X posts
 * @param {String} activityType - The activity type from the API (tweet, retweet, reply, quote, image, video)
 * @param {Array} media - The media array from the post
 * @param {String} content - The content/text of the post
 * @returns {String} - One of: TWEET, RETWEET, REPLY, QUOTE, IMAGE, VIDEO, THREAD, UNKNOWN
 */
export const detectTwitterPostType = (activityType, media = [], content = "") => {
  // Normalize the activity type
  if (!activityType) {
    activityType = "tweet";
  }

  // Check for explicit media types first
  if (activityType === "image") {
    return "IMAGE";
  }
  if (activityType === "video") {
    return "VIDEO";
  }

  // Check for thread pattern (multiple consecutive tweets or tweet with special markers)
  // Threads often have indicators like "1/n" pattern in content or explicit thread markers
  const isThread =
    content &&
    /^\d+\/\d+/i.test(content.trim()) &&
    content.includes("\n");

  if (isThread) {
    return "THREAD";
  }

  // Map standard activity types
  switch (activityType.toLowerCase()) {
    case "retweet":
      return "RETWEET";
    case "reply":
      return "REPLY";
    case "quote":
      return "QUOTE";
    case "tweet":
    default:
      return "TWEET";
  }
};

/**
 * Twitter post type configuration with labels, icons, and colors
 */
export const twitterPostTypeConfig = {
  TWEET: { label: "Tweet", icon: "FileText", color: "blue" },
  RETWEET: { label: "Retweet", icon: "Repeat2", color: "green" },
  REPLY: { label: "Reply", icon: "MessageSquare", color: "purple" },
  QUOTE: { label: "Quote", icon: "Quote", color: "red" },
  IMAGE: { label: "Image", icon: "Image", color: "cyan" },
  VIDEO: { label: "Video", icon: "Video", color: "orange" },
  THREAD: { label: "Thread", icon: "Layers", color: "yellow" },
  UNKNOWN: { label: "Unknown", icon: "HelpCircle", color: "gray" },
};

/**
 * Gets the configuration for a specific Twitter post type
 * @param {String} postType - The post type
 * @returns {Object} - Configuration object with label, icon, and color
 */
export const getTwitterPostTypeConfig = (postType) => {
  return twitterPostTypeConfig[postType] || twitterPostTypeConfig.UNKNOWN;
};

/**
 * All available Twitter filter types
 */
export const twitterFilterTypes = [
  "ALL",
  "TWEET",
  "RETWEET",
  "REPLY",
  "QUOTE",
  "IMAGE",
  "VIDEO",
  "THREAD",
];
