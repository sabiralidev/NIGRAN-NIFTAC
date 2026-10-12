import { motion } from 'framer-motion'

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = { sm: 16, md: 24, lg: 40 }
  const s = sizes[size] || sizes.md

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-full border-2 border-accent-blue/20 border-t-accent-blue animate-spin"
        style={{ width: s, height: s }}
      />
      {text && <p className="text-slate-500 text-sm">{text}</p>}
    </div>
  )
}

export const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-transparent">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-lg"
      >
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </motion.div>
      <p className="text-sm text-slate-500">Loading NIGRAN...</p>
    </div>
  </div>
)

export default LoadingSpinner
