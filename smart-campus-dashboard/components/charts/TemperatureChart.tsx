'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useDashboardStore } from '@/store/useDashboardStore'
import { Card } from '@/components/ui/Card'

// Warna berbeda untuk tiap ruangan di chart
const ROOM_COLORS = ['#4FC3E8', '#2DD4BF', '#F5A623', '#FF4D6A', '#A78BFA']

// Custom Tooltip agar tampil sesuai tema gelap
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border-main rounded-xl p-3 shadow-xl">
      <p className="text-text-muted text-xs mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="text-text-primary font-mono font-semibold">
            {entry.value?.toFixed(1)}°C
          </span>
        </div>
      ))}
    </div>
  )
}

export function TemperatureChart() {
  const chartHistory = useDashboardStore((state) => state.chartHistory)
  const environments = useDashboardStore((state) => state.environments)

  // Ambil semua roomId yang ada
  const roomIds = Object.keys(environments)

  // Bangun data format Recharts dari chart history
  // Format yang dibutuhkan: [{ time, "room-a": 28.5, "room-b": 27.1 }, ...]
  const allTimes = new Set<string>()
  roomIds.forEach((roomId) => {
    const points = chartHistory[`${roomId}-temperature`] ?? []
    points.forEach((p) => allTimes.add(p.time))
  })

  const chartData = Array.from(allTimes)
    .sort()
    .slice(-20) // Tampilkan 20 data point terakhir
    .map((time) => {
      const point: Record<string, string | number> = { time }
      roomIds.forEach((roomId) => {
        const history = chartHistory[`${roomId}-temperature`] ?? []
        const found = history.find((p) => p.time === time)
        if (found) point[roomId] = found.value
      })
      return point
    })

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-text-primary font-semibold">Temperature History</h2>
          <p className="text-text-muted text-xs mt-0.5">Last 20 readings per room</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E5F7A" opacity={0.4} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#5A7A8E', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#2E5F7A' }}
          />
          <YAxis
            tick={{ fill: '#5A7A8E', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            unit="°C"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#A8C8E0' }}
          />
          {roomIds.map((roomId, i) => (
            <Line
              key={roomId}
              type="monotone"
              dataKey={roomId}
              name={environments[roomId]?.roomName ?? roomId}
              stroke={ROOM_COLORS[i % ROOM_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}