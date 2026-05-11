'use client'

import { motion } from 'framer-motion'
import { useDashboardStore } from '@/store/useDashboardStore'
import { Navbar } from '@/components/dashboard/Navbar'
import { EnvironmentCard } from '@/components/dashboard/EnvironmentCard'
import { OccupancyCard } from '@/components/dashboard/OccupancyCard'
import { AlertPanel } from '@/components/dashboard/AlertPanel'
import { TemperatureChart } from '@/components/charts/TemperatureChart'

export default function DashboardPage() {
  const environments = useDashboardStore((s) => s.environments)
  const occupancies  = useDashboardStore((s) => s.occupancies)
  const alerts       = useDashboardStore((s) => s.alerts)

  const envList  = Object.values(environments)
  const occList  = Object.values(occupancies)
  const critical = alerts.filter((a) => a.severity === 'critical').length

  // Hitung rata-rata suhu semua ruangan
  const avgTemp =
    envList.length > 0
      ? (
          envList.reduce((sum, r) => sum + (r.temperature ?? 0), 0) /
          envList.length
        ).toFixed(1)
      : null

  const summaryStats = [
    {
      label: 'Rooms Monitored',
      value: envList.length,
      color: 'text-accent',
    },
    {
      label: 'Active Alerts',
      value: alerts.length,
      color: alerts.length > 0 ? 'text-warning' : 'text-success',
    },
    {
      label: 'Critical Alerts',
      value: critical,
      color: critical > 0 ? 'text-danger' : 'text-success',
    },
    {
      label: 'Avg Temperature',
      value: avgTemp ? `${avgTemp}°C` : '—',
      color: 'text-text-primary',
    },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 pb-12 max-w-[1600px] mx-auto">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-text-primary">Campus Overview</h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time monitoring via MQTT microservices
          </p>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {summaryStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-surface border border-border-main rounded-xl p-4"
              >
                <p className="text-text-muted text-xs">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono mt-1 ${stat.color}`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Temperature chart ────────────────────────────── */}
        <section className="mb-8">
          <TemperatureChart />
        </section>

        {/* ── Environment + Alert ──────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Environment cards (kiri, 2/3 lebar) */}
          <div className="xl:col-span-2">
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
              <span className="w-1 h-4 bg-accent rounded-full" />
              Environment Sensors
            </h2>

            {envList.length === 0 ? (
              <div className="bg-surface border border-border-main rounded-2xl p-12 text-center text-text-muted text-sm">
                <p>Waiting for sensor data...</p>
                <p className="text-xs mt-1 opacity-60">
                  Make sure backend publishers are running
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envList.map((room, i) => (
                  <EnvironmentCard key={room.roomId} room={room} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Alert panel (kanan, 1/3 lebar) */}
          <div>
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
              <span className="w-1 h-4 bg-danger rounded-full" />
              Alert Center
            </h2>
            <AlertPanel />
          </div>
        </div>

        {/* ── Occupancy ────────────────────────────────────── */}
        <section>
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
            <span className="w-1 h-4 bg-success rounded-full" />
            Room Occupancy
          </h2>

          {occList.length === 0 ? (
            <div className="bg-surface border border-border-main rounded-2xl p-12 text-center text-text-muted text-sm">
              <p>Waiting for occupancy data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {occList.map((room, i) => (
                <OccupancyCard key={room.roomId} room={room} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}