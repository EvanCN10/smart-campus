'use client'

// Fitur Dashboard Monitoring: System Status Panel
// Menampilkan status online/offline setiap service berdasarkan LWT & retained messages

import { motion } from 'framer-motion'
import { Server, Circle } from 'lucide-react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { Card } from '@/components/ui/Card'

const serviceLabels: Record<string, string> = {
  'sensor-environment': 'Env Sensor',
  'sensor-occupancy': 'Occ Sensor',
  'system-admin': 'Admin Service',
  'sensor-gateway': 'Gateway',
}

export function SystemStatusPanel() {
  const systemStatus = useDashboardStore((s) => s.systemStatus)
  const entries = Object.entries(systemStatus)

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg">
          <Server size={14} className="text-accent" />
        </div>
        <h2 className="text-text-primary font-semibold text-sm">System Services</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-4">
          Waiting for service status via LWT...
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map(([service, status], i) => (
            <motion.div
              key={service}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-2 px-3 bg-bg-primary/50 rounded-lg"
            >
              <span className="text-text-secondary text-xs font-medium">
                {serviceLabels[service] ?? service}
              </span>
              <div className="flex items-center gap-1.5">
                <Circle
                  size={8}
                  fill={status === 'online' ? '#2DD4BF' : '#FF4D6A'}
                  className={status === 'online' ? 'text-success' : 'text-danger'}
                />
                <span
                  className={`text-xs font-mono font-semibold ${
                    status === 'online' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {status.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  )
}
