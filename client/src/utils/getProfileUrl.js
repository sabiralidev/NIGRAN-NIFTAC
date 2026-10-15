const platformProfileUrls = {
  twitter: (username) => `https://twitter.com/${username}`,
  facebook: (username) => `https://facebook.com/${username}`,
  instagram: (username) => `https://instagram.com/${username}`,
  youtube: (username) => `https://youtube.com/@${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
  bluesky: (username) => `https://bsky.app/profile/${username}`,
  // Add other platforms as needed
};

export const getProfileUrl = (platform, username) => {
  const platformLower = platform?.toLowerCase();
  if (platformLower in platformProfileUrls) {
    return platformProfileUrls[platformLower](username);
  }
  // Fallback for unhandled platforms
  return `https://google.com/search?q=${username}`;
};
