'use client'

// Fitur Dashboard Monitoring: Kontrol Interaktif
// Panel ini memungkinkan user mengirim command dari dashboard ke backend via MQTT
// Mencakup: Publish Announcement, Trigger Health Check, Simulasi Burst (overload)

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, HeartPulse, Zap, ChevronDown, ChevronUp, Radio } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { publishFromDashboard } from '@/lib/mqtt-client'
import { useDashboardStore } from '@/store/useDashboardStore'

export function ControlPanel() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [publishStatus, setPublishStatus] = useState<string | null>(null)
  const [burstCount, setBurstCount] = useState(20)
  const connectionStatus = useDashboardStore((s) => s.connectionStatus)

  const isConnected = connectionStatus === 'connected'

  function handlePublishAnnouncement() {
    if (!announcementTitle.trim() || !announcementMsg.trim()) return
    const payload = JSON.stringify({
      title: announcementTitle,
      message: announcementMsg,
      timestamp: new Date().toISOString(),
    })
    // Fitur MQTT: Publish dari dashboard ke topic announcements (QoS 2)
    publishFromDashboard('campus/announcements/broadcast', payload, 2)
    setPublishStatus('Announcement sent!')
    setAnnouncementTitle('')
    setAnnouncementMsg('')
    setTimeout(() => setPublishStatus(null), 3000)
  }

  function handleHealthCheck() {
    // Fitur MQTT: Request-Response dari dashboard
    // Mengirim request health check yang akan direspons oleh publisher-env
    const payload = JSON.stringify({ type: 'health-check', from: 'dashboard' })
    publishFromDashboard('campus/system/request/health', payload, 1)
    setPublishStatus('Health check request sent!')
    setTimeout(() => setPublishStatus(null), 3000)
  }

  function handleBurstSimulation() {
    // Fitur MQTT: Flow Control / Overload Scenario
    // Mengirim banyak pesan sekaligus untuk menguji flow control (receiveMaximum)
    // Subscriber-logger memiliki receiveMaximum=5, sehingga broker akan menahan
    // pesan jika lebih dari 5 QoS 1/2 pesan belum di-acknowledge
    for (let i = 0; i < burstCount; i++) {
      const payload = JSON.stringify({
        id: `burst-alert-${Date.now()}-${i}`,
        severity: 'info' as const,
        location: 'Dashboard',
        message: `[BURST TEST ${i + 1}/${burstCount}] Simulasi overload — pesan ini dikirim massal untuk menguji flow control (receiveMaximum).`,
        timestamp: new Date().toISOString(),
      })
      publishFromDashboard(`campus/alerts/info/dashboard-burst`, payload, 1)
    }
    setPublishStatus(`Burst: ${burstCount} messages sent! Check subscriber-logger console.`)
    setTimeout(() => setPublishStatus(null), 5000)
  }

  return (
    <Card>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/10 rounded-lg">
            <Radio size={14} className="text-accent" />
          </div>
          <h2 className="text-text-primary font-semibold text-sm">MQTT Control Panel</h2>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-text-muted" />
        ) : (
          <ChevronDown size={16} className="text-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {/* Status feedback */}
              <AnimatePresence>
                {publishStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-success/10 border border-success/30 text-success text-xs px-3 py-2 rounded-lg"
                  >
                    ✓ {publishStatus}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Publish Announcement */}
              <div className="space-y-2">
                <label className="text-text-secondary text-xs font-medium flex items-center gap-1.5">
                  <Send size={12} />
                  Publish Announcement
                </label>
                <input
                  type="text"
                  placeholder="Judul pengumuman..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-bg-primary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
                <textarea
                  placeholder="Isi pesan pengumuman..."
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  rows={2}
                  className="w-full bg-bg-primary border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
                <button
                  onClick={handlePublishAnnouncement}
                  disabled={!isConnected || !announcementTitle.trim() || !announcementMsg.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                  Publish (QoS 2)
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                {/* Health Check */}
                <button
                  onClick={handleHealthCheck}
                  disabled={!isConnected}
                  className="flex items-center justify-center gap-2 bg-success/10 hover:bg-success/20 text-success border border-success/30 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <HeartPulse size={14} />
                  Health Check
                </button>

                {/* Burst Simulation */}
                <button
                  onClick={handleBurstSimulation}
                  disabled={!isConnected}
                  className="flex items-center justify-center gap-2 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap size={14} />
                  Burst ({burstCount} msg)
                </button>
              </div>

              {/* Burst Count Slider */}
              <div className="space-y-1">
                <label className="text-text-muted text-xs">
                  Burst count: <span className="text-text-primary font-mono">{burstCount}</span> messages
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={burstCount}
                  onChange={(e) => setBurstCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-border-main rounded-full appearance-none cursor-pointer accent-warning"
                />
                <p className="text-text-muted text-xs opacity-60">
                  Simulasi overload untuk menguji flow control (receiveMaximum=5)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
