import { useEffect, useMemo, useState } from 'react'
import { User } from 'lucide-react'
import clsx from 'clsx'
import { normalizeProfileImageUrl } from '../utils/avatar'

const SIZE_CLASS_MAP = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const AvatarImage = ({
  src,
  alt,
  size = 'md',
  className,
  imgClassName,
  fallbackLabel,
}) => {
  const [hasImageError, setHasImageError] = useState(false)

  const safeSrc = useMemo(() => normalizeProfileImageUrl(src), [src])

  useEffect(() => {
    setHasImageError(false)
  }, [safeSrc])

  const sizeClass = SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.md
  const shouldShowImage = !!safeSrc && !hasImageError

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-full bg-slate-100 border border-border flex items-center justify-center shrink-0',
        sizeClass,
        className
      )}
    >
      {shouldShowImage ? (
        <img
          src={safeSrc}
          alt={alt || 'Profile image'}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={clsx('w-full h-full object-cover', imgClassName)}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          {fallbackLabel ? (
            <span className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
              {fallbackLabel.slice(0, 2)}
            </span>
          ) : (
            <User size={18} className="text-slate-400" aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  )
}

export default AvatarImage
