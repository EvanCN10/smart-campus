'use client'

// Fitur Dashboard Monitoring: Announcement Banner
// Menampilkan pengumuman terbaru yang diterima dari MQTT topic campus/announcements/broadcast

import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useState } from 'react'

export function AnnouncementBanner() {
  const announcement = useDashboardStore((s) => s.latestAnnouncement)
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state ketika ada announcement baru
  const announcementKey = announcement?.timestamp ?? ''

  if (!announcement || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        key={announcementKey}
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-accent/20 rounded-lg flex-shrink-0 mt-0.5">
            <Megaphone size={14} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-accent font-semibold text-sm">{announcement.title}</h3>
              <span className="text-text-muted text-xs font-mono">
                {new Date(announcement.timestamp).toLocaleTimeString('id-ID')}
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{announcement.message}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-accent/20 text-text-muted hover:text-accent transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
