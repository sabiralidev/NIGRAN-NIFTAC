import React from 'react';
import { useParams } from 'react-router-dom';
import TwitterAccounts from './Accounts/TwitterAccounts';
import FacebookAccounts from './Accounts/FacebookAccounts';
import InstagramAccounts from './Accounts/InstagramAccounts';
import TikTokAccounts from './Accounts/TikTokAccounts';
import SnapchatAccounts from './Accounts/SnapchatAccounts';
import TelegramAccounts from './Accounts/TelegramAccounts';
import BlueskyAccounts from './Accounts/BlueskyAccounts';
import YouTubeAccounts from './Accounts/YouTubeAccounts';
import ZangiAccounts from './Accounts/ZangiAccounts';

const PlatformAccounts = () => {
  const { platform } = useParams();

  switch (platform) {
    case 'twitter':
      return <TwitterAccounts />;
    case 'facebook':
      return <FacebookAccounts />;
    case 'instagram':
        return <InstagramAccounts />;
    case 'tiktok':
        return <TikTokAccounts />;
    case 'snapchat':
        return <SnapchatAccounts />;
    case 'telegram':
        return <TelegramAccounts />;
    case 'bluesky':
        return <BlueskyAccounts />;
    case 'youtube':
        return <YouTubeAccounts />;
    case 'zangi':
        return <ZangiAccounts />;
    default:
      return <div>Invalid Platform</div>;
  }
};

export default PlatformAccounts;
