'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { Card } from '@/components/ui/Card'
import type { AlertData } from '@/lib/types'

const severityConfig = {
  critical: {
    Icon: AlertCircle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    label: 'CRITICAL',
  },
  warning: {
    Icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    label: 'WARNING',
  },
  info: {
    Icon: Info,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    label: 'INFO',
  },
}

function AlertItem({ alert }: { alert: AlertData }) {
  const { Icon, color, bg, border, label } = severityConfig[alert.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${bg} ${border} mb-2`}
    >
      <Icon size={16} className={`${color} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold ${color}`}>{label}</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-text-muted text-xs font-mono">{alert.location}</span>
        </div>
        <p className="text-text-secondary text-sm leading-snug">{alert.message}</p>
        <p className="text-text-muted text-xs mt-1">
          {new Date(alert.timestamp).toLocaleTimeString('id-ID')}
        </p>
      </div>
    </motion.div>
  )
}

export function AlertPanel() {
  const alerts = useDashboardStore((state) => state.alerts)
  const clearAlerts = useDashboardStore((state) => state.clearAlerts)

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-text-primary font-semibold">Alert Center</h2>
          <p className="text-text-muted text-xs mt-0.5">
            {alerts.length} alerts
            {criticalCount > 0 && (
              <span className="text-danger ml-1">· {criticalCount} critical</span>
            )}
          </p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-danger/10"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[400px] pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <AlertTriangle size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No alerts yet</p>
            <p className="text-xs mt-1 opacity-70">System is running normally</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </Card>
  )
}