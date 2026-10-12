import { FaYoutube, FaFacebook, FaTwitter, FaTiktok, FaInstagram } from 'react-icons/fa'
import { LayoutGrid } from 'lucide-react'

const PLATFORMS = [
  { id: 'all', label: 'All Platforms', icon: LayoutGrid, color: '#64748b' },
  { id: 'twitter', label: 'Twitter', icon: FaTwitter, color: '#1DA1F2' },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  { id: 'facebook', label: 'Facebook', icon: FaFacebook, color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E1306C' },
  { id: 'tiktok', label: 'TikTok', icon: FaTiktok, color: '#000000' },
]

const PlatformTabs = ({ active, onChange }) => {
  return (
    <div className="platform-tabs-track scrollbar-hide flex gap-1.5 overflow-x-auto sm:gap-2">
      {PLATFORMS.map((p) => {
        const isActive = active === p.id;
        const Icon = p.icon;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            type="button"
            className={`platform-tab shrink-0 ${isActive ? 'active' : ''}`}
            data-platform={p.id}
          >
            {Icon && (
              <span
                className={`platform-tab-icon ${isActive ? 'platform-tab-icon-active' : ''}`}
                style={{ color: p.color }}
              >
                <Icon size={18} className="sm:hidden" />
                <Icon size={20} className="hidden sm:block" />
              </span>
            )}
            <span className="platform-tab-label whitespace-nowrap">{p.label}</span>
          </button>
        );
      })}
    </div>
  )
}

export { PLATFORMS }
export default PlatformTabs