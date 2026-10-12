import { motion } from 'framer-motion'
import { ExternalLink, Pause, Play, Trash2, RefreshCw, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { useUpdateAccountStatus, useRemoveAccount, useRefreshAccount } from '../hooks/useAccounts'
import clsx from 'clsx'
import AvatarImage from './AvatarImage'
import ConfirmModal from './ConfirmModal'

import { getProfileUrl } from '../utils/getProfileUrl'

const AccountCard = ({ account, platform, onRemove, onToggle, onRefresh }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [loadingAction, setLoadingAction] = useState(null)
  const updateStatus = useUpdateAccountStatus()
  const removeAccount = useRemoveAccount()
  const refreshAccount = useRefreshAccount()
  const menuRef = useRef(null)
  const menuContainerRef = useRef(null)
  const buttonRef = useRef(null)
  const [menuPosition, setMenuPosition] = useState('bottom')

  const profileUrl = getProfileUrl(platform, account.username)

  const isActive = account.monitoringStatus === 'active'

  const statusConfig = {
    active: { label: 'Active', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dot: 'bg-blue-500' },
    paused: { label: 'Paused', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500' },
    error: { label: 'Error', badge: 'bg-red-50 text-red-700 ring-1 ring-red-200', dot: 'bg-red-500' },
  }

  const status = statusConfig[account.monitoringStatus] || statusConfig.active
  const fallbackLabel = (account.displayName || account.username || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showMenu && buttonRef.current && menuContainerRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 200
      const spaceBelow = window.innerHeight - buttonRect.bottom

      if (spaceBelow < menuHeight) {
        setMenuPosition('top')
      } else {
        setMenuPosition('bottom')
      }
    }
  }, [showMenu])

  const handleToggle = async () => {
    const newStatus = isActive ? 'paused' : 'active'
    setLoadingAction('toggle')
    try {
      if (onToggle) {
        await Promise.resolve(onToggle(account._id, newStatus))
      } else {
        await updateStatus.mutateAsync({ id: account._id, status: newStatus })
      }
    } catch (e) {
      // errors are handled by callers/hooks
    } finally {
      setLoadingAction(null)
      setShowMenu(false)
    }
  }

  const handleRemove = () => {
    setShowMenu(false)
    setShowRemoveConfirm(true)
  }

  const confirmRemove = async () => {
    setShowRemoveConfirm(false)
    setLoadingAction('remove')
    try {
      if (onRemove) {
        await Promise.resolve(onRemove(account._id))
      } else {
        await removeAccount.mutateAsync(account._id)
      }
    } catch (e) {
      // noop
    } finally {
      setLoadingAction(null)
      setShowMenu(false)
    }
  }

  const handleRefresh = async () => {
    setLoadingAction('refresh')
    try {
      if (onRefresh) {
        await Promise.resolve(onRefresh(account._id))
      } else {
        await refreshAccount.mutateAsync(account._id)
      }
    } catch (e) {
      // noop
    } finally {
      setLoadingAction(null)
      setShowMenu(false)
    }
  }

  return (
    <>
      <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'grid grid-cols-1 sm:grid-cols-[1fr_120px_90px_70px] items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/80 transition-colors',
        loadingAction && 'animate-pulse'
      )}
    >
      {/* Account Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <AvatarImage
          src={account.profileImage}
          alt={`${account.username} profile image`}
          size="md"
          fallbackLabel={fallbackLabel}
          className="border border-border flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {account.displayName || account.username}
            </h3>
            {account.verified && <span className="text-blue-600 text-xs flex-shrink-0">✓</span>}
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-blue-700 transition-colors flex items-center gap-1 truncate"
          >
            <span className="truncate">
              {account.lastChecked
                ? `Updated ${formatDistanceToNow(new Date(account.lastChecked), { addSuffix: true })}`
                : `@${account.username}`}
            </span>
            <ExternalLink size={10} className="flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Status & Alerts & Actions - Mobile row */}
      <div className="flex sm:grid sm:grid-cols-[120px_90px_70px] items-center gap-2 sm:gap-4 w-full">
        {/* Status */}
        <div className="flex-1 sm:flex-none">
          <span className={clsx('inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap', status.badge)}>
            <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', status.dot)} />
            {status.label}
          </span>
        </div>

        {/* Alerts */}
        <div className="flex-1 sm:flex-none">
          <span className={clsx(
            'inline-flex items-center justify-center min-w-[24px] sm:min-w-[28px] px-1.5 sm:px-2 py-1 rounded-full text-xs font-semibold tabular-nums',
            account.alertCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
          )}>
            {account.alertCount || 0}
          </span>
        </div>

        {/* Actions */}
        <div className="flex-1 sm:flex-none flex justify-end">
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div
                ref={menuContainerRef}
                className={clsx(
                  'absolute right-0 w-40 sm:w-44 max-w-[calc(100vw-2rem)] bg-white border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden',
                  menuPosition === 'bottom' ? 'top-8' : 'bottom-8'
                )}
              >
                <button
                  onClick={handleToggle}
                  disabled={!!loadingAction || updateStatus.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {loadingAction === 'toggle' ? (
                    <Pause size={14} className="text-yellow-600 animate-spin" />
                  ) : (
                    isActive ? <Pause size={14} className="text-yellow-600" /> : <Play size={14} className="text-green-600" />
                  )}
                  {isActive ? 'Pause Monitoring' : 'Resume Monitoring'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={!!loadingAction || refreshAccount.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw size={14} className={clsx('text-blue-600', loadingAction === 'refresh' && 'animate-spin')} />
                  Refresh Profile
                </button>
                <hr className="border-border" />
                <button
                  onClick={handleRemove}
                  disabled={!!loadingAction || removeAccount.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  {loadingAction === 'remove' ? <Trash2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Remove Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </motion.div>
      <ConfirmModal
        isOpen={showRemoveConfirm}
        title="Remove Account?"
        message={`Are you sure you want to remove @${account.username} from monitoring?`}
        onCancel={() => setShowRemoveConfirm(false)}
        onConfirm={confirmRemove}
      />
    </>
  )
}

export default AccountCard