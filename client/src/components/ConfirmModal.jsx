import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ConfirmModal = ({ isOpen, title = 'Remove Account', message, onCancel, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-900 sm:text-lg">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close confirmation"
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Remove Account
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmModal
