const SAFE_PROTOCOLS = new Set(["http:", "https:"]);
const INSTAGRAM_HOST_HINTS = ["instagram.com", "cdninstagram.com"];
const FACEBOOK_HOSTS = ["fbcdn.net", "facebook.com"];
const INSTAGRAM_PROXY_BASE =
  "http://" + location.hostname + ":5003/instagram/posts/proxy/image";

const toInstagramProxyUrl = (rawUrl) => {
  if (typeof rawUrl !== "string") return "";
  const value = rawUrl.trim();
  if (!value) return "";

  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    return value;
  }

  // Don't proxy Facebook URLs - they support CORS natively
  const isFacebookUrl = FACEBOOK_HOSTS.some((hint) =>
    value.toLowerCase().includes(hint),
  );
  if (isFacebookUrl) return value;

  const looksInstagramCdn = INSTAGRAM_HOST_HINTS.some((hint) =>
    value.toLowerCase().includes(hint),
  );

  if (!looksInstagramCdn) return value;
  return `${INSTAGRAM_PROXY_BASE}?url=${encodeURIComponent(value)}`;
};

export const normalizeProfileImageUrl = (rawUrl) => {
  if (typeof rawUrl !== "string") return "";

  const url = rawUrl.trim();
  if (!url) return "";

  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return url;
  }

  if (/^[\w-]+\//.test(url) || url.startsWith("./")) {
    return `/${url.replace(/^\.?\/?/, "")}`;
  }

  try {
    const parsed = new URL(url);
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return "";
    return toInstagramProxyUrl(parsed.toString());
  } catch {
    return "";
  }
};
