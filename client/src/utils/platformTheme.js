import { LayoutGrid } from 'lucide-react'
import { FaTwitter, FaYoutube, FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa'

/**
 * Central platform identity.
 * - `brand`  = the platform's true logo color (used only for the small platform ICON,
 *              so a Twitter bird still reads as Twitter).
 * - `accent` = a refined, slightly-muted UI accent for active nav states, rings, and
 *              highlights. Deliberately less saturated/bright than the raw brand color
 *              so the interface stays calm and enterprise (e.g. TikTok reads as a cool
 *              teal here, not warm black).
 * - `soft`   = a faint tinted surface for active backgrounds.
 * - `text`   = a readable accent text color on light surfaces.
 */
export const PLATFORM_THEME = {
  all:       { id: 'all',       label: 'All Platforms', short: 'All',       Icon: LayoutGrid, brand: '#475569', accent: '#1e40af', soft: '#eef3ff', text: '#1e40af' },
  twitter:   { id: 'twitter',   label: 'Twitter',       short: 'Twitter',   Icon: FaTwitter,  brand: '#1DA1F2', accent: '#1583c7', soft: '#e9f4fc', text: '#0f5f96' },
  youtube:   { id: 'youtube',   label: 'YouTube',       short: 'YouTube',   Icon: FaYoutube,  brand: '#FF0000', accent: '#c7362e', soft: '#fdeceb', text: '#a12a24' },
  facebook:  { id: 'facebook',  label: 'Facebook',      short: 'Facebook',  Icon: FaFacebook, brand: '#1877F2', accent: '#2456c4', soft: '#eaf1fe', text: '#1c458f' },
  instagram: { id: 'instagram', label: 'Instagram',     short: 'Instagram', Icon: FaInstagram, brand: '#E1306C', accent: '#c13584', soft: '#fceaf3', text: '#9d2b64' },
  tiktok:    { id: 'tiktok',    label: 'TikTok',        short: 'TikTok',    Icon: FaTiktok,   brand: '#111827', accent: '#0e7490', soft: '#e6f5f7', text: '#0b5a62' },
}

// Ordered list used by the platform switcher.
export const PLATFORM_ORDER = ['all', 'twitter', 'youtube', 'facebook', 'instagram', 'tiktok']

export const PLATFORMS = PLATFORM_ORDER.map((id) => PLATFORM_THEME[id])

export const getPlatformTheme = (id) =>
  PLATFORM_THEME[id] || { id, label: id, short: id, Icon: LayoutGrid, brand: '#475569', accent: '#1e40af', soft: '#eef3ff', text: '#1e40af' }
