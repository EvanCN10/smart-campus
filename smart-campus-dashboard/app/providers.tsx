'use client'

// Semua context provider yang butuh 'use client' dikumpulkan di sini
// agar app/layout.tsx tetap bisa jadi Server Component

import { useMqtt } from '@/hooks/useMqtt'

export function Providers({ children }: { children: React.ReactNode }) {
  // Inisialisasi MQTT connection di level tertinggi app
  useMqtt()

  return <>{children}</>
}