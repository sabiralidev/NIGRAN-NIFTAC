export const getPlatformUrl = (alert) => {
  if (!alert) return null;

  const platform = (alert.platform || "twitter").toLowerCase();

  switch (platform) {
    case "twitter":
    case "x":
      if (alert.tweetUrl) return alert.tweetUrl;
      if (alert.tweetId && alert.username) {
        return `https://twitter.com/${alert.username}/status/${alert.tweetId}`;
      }
      break;

    case "facebook":
      if (alert.url) return alert.url;
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "instagram":
      if (alert.url) return alert.url;
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "youtube":
      if (alert.url) return alert.url;
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "tiktok":
      if (alert.url) return alert.url;
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "telegram":
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "snapchat":
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "bluesky":
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    case "zangi":
      if (alert.sourceUrl) return alert.sourceUrl;
      if (alert.tweetUrl) return alert.tweetUrl;
      break;

    default:
      return alert.sourceUrl || alert.tweetUrl || null;
  }

  return null;
};
