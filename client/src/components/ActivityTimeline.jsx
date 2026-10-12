import { motion, AnimatePresence } from 'framer-motion'
import { FileText } from 'lucide-react'
import AlertCard from './AlertCard'

const ActivityTimeline = ({ alerts = [], maxItems = 10, onDismiss }) => {
  // Filter out any undefined or invalid alerts
  const validAlerts = alerts.filter(alert => {
    if (!alert) return false
    // Check if alert has required fields
    return alert._id || alert.id || alert.postUrl
  })
  
  const items = validAlerts.slice(0, maxItems)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FileText size={20} className="text-slate-500" />
        </div>
        <p className="text-slate-600 text-sm">No activity yet</p>
        <p className="text-slate-400 text-xs mt-1">Alerts will appear here in real-time</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {items.map((alert, index) => {
          // Safety check - if alert is invalid, skip it
          if (!alert) return null
          
          // Generate a unique key
          const key = alert._id || alert.id || alert.postUrl || `alert-${index}`
          const platform = alert.platform || 'unknown'
          
          return (
            <motion.div
              key={`${platform}-${key}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                delay: Math.min(index * 0.02, 0.3),
                duration: 0.2,
                ease: "easeOut"
              }}
              style={{ willChange: "transform, opacity" }}
            >
              <AlertCard
                alert={alert}
                variant="compact"
                onDismiss={onDismiss}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default ActivityTimeline