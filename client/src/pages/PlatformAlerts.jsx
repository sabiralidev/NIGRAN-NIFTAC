import React from 'react';
import { useParams } from 'react-router-dom';
import TwitterAlerts from './Alerts/TwitterAlerts';
import FacebookAlerts from './Alerts/FacebookAlerts';
import InstagramAlerts from './Alerts/InstagramAlerts';
import TikTokAlerts from './Alerts/TikTokAlerts';
import SnapchatAlerts from './Alerts/SnapchatAlerts';
import TelegramAlerts from './Alerts/TelegramAlerts';
import BlueskyAlerts from './Alerts/BlueskyAlerts';
import YouTubeAlerts from './Alerts/YouTubeAlerts';
import ZangiAlerts from './Alerts/ZangiAlerts';

const PlatformAlerts = () => {
  const { platform } = useParams();

  switch (platform) {
    case 'twitter':
      return <TwitterAlerts />;
    case 'facebook':
      return <FacebookAlerts />;
    case 'instagram':
        return <InstagramAlerts />;
    case 'tiktok':
        return <TikTokAlerts />;
    case 'snapchat':
        return <SnapchatAlerts />;
    case 'telegram':
        return <TelegramAlerts />;
    case 'bluesky':
        return <BlueskyAlerts />;
    case 'youtube':
        return <YouTubeAlerts />;
    case 'zangi':
        return <ZangiAlerts />;
    default:
      return <div>Invalid Platform</div>;
  }
};

export default PlatformAlerts;
