'use client'

// Fitur Dashboard Monitoring: Room Filter
// Memungkinkan user memilih ruangan tertentu untuk ditampilkan
// Ini adalah kontrol interaktif untuk filtering data

import { useDashboardStore } from '@/store/useDashboardStore'
import { Filter } from 'lucide-react'

export function RoomFilter() {
  const environments = useDashboardStore((s) => s.environments)
  const selectedRoomFilter = useDashboardStore((s) => s.selectedRoomFilter)
  const setSelectedRoomFilter = useDashboardStore((s) => s.setSelectedRoomFilter)

  const rooms = Object.values(environments)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={14} className="text-text-muted" />
      <button
        onClick={() => setSelectedRoomFilter(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
          selectedRoomFilter === null
            ? 'bg-accent/20 text-accent border-accent/40'
            : 'bg-surface text-text-muted border-border-main hover:border-accent/30 hover:text-text-secondary'
        }`}
      >
        All Rooms
      </button>
      {rooms.map((room) => (
        <button
          key={room.roomId}
          onClick={() =>
            setSelectedRoomFilter(
              selectedRoomFilter === room.roomId ? null : room.roomId
            )
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
            selectedRoomFilter === room.roomId
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-surface text-text-muted border-border-main hover:border-accent/30 hover:text-text-secondary'
          }`}
        >
          {room.roomName}
        </button>
      ))}
    </div>
  )
}
