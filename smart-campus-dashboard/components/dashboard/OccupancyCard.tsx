'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { RoomOccupancy } from '@/lib/types'

interface OccupancyCardProps {
  room: RoomOccupancy
  index: number
}

function getOccupancyVariant(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage >= 90) return 'danger'
  if (percentage >= 70) return 'warning'
  return 'success'
}

export function OccupancyCard({ room, index }: OccupancyCardProps) {
  const variant = getOccupancyVariant(room.percentage)

  const barColor = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card glowOnHover>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Users size={16} className="text-accent" />
            </div>
            <div>
              <h3 className="text-text-primary font-semibold text-sm">{room.roomName}</h3>
              <p className="text-text-muted text-xs font-mono">{room.roomId}</p>
            </div>
          </div>
          <Badge variant={variant} label={`${room.percentage}%`} />
        </div>

        {/* Count display */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-4xl font-bold text-text-primary font-mono">
            {room.count}
          </span>
          <span className="text-text-muted text-sm">/ {room.capacity} people</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(room.percentage, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {room.lastUpdated && (
          <p className="text-text-muted text-xs mt-3">
            Updated: {new Date(room.lastUpdated).toLocaleTimeString('id-ID')}
          </p>
        )}
      </Card>
    </motion.div>
  )
}