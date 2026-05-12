import { useDashboardStore } from '@/store/useDashboardStore'
import type {
  EnvironmentData,
  OccupancyData,
  AlertData,
  SystemStatusData,
  AnnouncementData,
  SensorMetadata,
} from '@/lib/types'

// Fungsi ini dipanggil setiap kali pesan MQTT masuk
// topic: string path seperti "campus/environment/room-a/temperature"
// payload: Buffer yang harus dikonversi ke string lalu di-parse JSON
// packet: MQTT v5 packet yang berisi user properties, dll

export function parseMqttMessage(topic: string, payload: Buffer, packet?: any): void {
  const store = useDashboardStore.getState()

  let parsed: unknown
  try {
    parsed = JSON.parse(payload.toString())
  } catch {
    // console.error('[MQTT Parser] Payload bukan JSON valid:', payload.toString())
    return
  }

  // Pecah topic menjadi array segmen
  // "campus/environment/room-a/temperature" → ["campus", "environment", "room-a", "temperature"]
  const segments = topic.split('/')

  // Validasi prefix
  if (segments[0] !== 'campus') return

  const category = segments[1]

  // ── Environment ──────────────────────────────────────────────
  // Topic: campus/environment/{roomId}/{metric}
  if (category === 'environment' && segments.length === 4) {
    const roomId = segments[2]
    const metric = segments[3]
    const data = parsed as EnvironmentData

    // Fitur MQTT: Membaca User Properties (Metadata) dari MQTT v5 packet
    // User Properties dikirim oleh publisher-env sebagai metadata sensor
    let metadata: SensorMetadata | undefined
    if (packet?.properties?.userProperties) {
      const props = packet.properties.userProperties
      metadata = {
        sensorType: props['sensor-type'] ?? null,
        locationBuilding: props['location-building'] ?? null,
      }
    }

    if (metric === 'temperature') {
      store.updateEnvironment(roomId, 'temperature', data, metadata)
    } else if (metric === 'humidity') {
      store.updateEnvironment(roomId, 'humidity', data, metadata)
    } else if (metric === 'air-quality') {
      store.updateEnvironment(roomId, 'airQuality', data, metadata)
    }
    return
  }

  // ── Occupancy ─────────────────────────────────────────────────
  // Topic: campus/occupancy/{roomId}/count
  if (category === 'occupancy' && segments.length === 4) {
    const roomId = segments[2]
    const data = parsed as OccupancyData
    store.updateOccupancy(roomId, data)
    return
  }

  // ── Alerts ────────────────────────────────────────────────────
  // Topic: campus/alerts/{severity}/{location}
  if (category === 'alerts' && segments.length === 4) {
    const severity = segments[2] as AlertData['severity']
    const data = parsed as Omit<AlertData, 'severity'>
    store.addAlert({ ...data, severity })
    return
  }

  // ── System Status ─────────────────────────────────────────────
  // Topic: campus/system/server/status
  if (category === 'system') {
    const data = parsed as SystemStatusData
    store.updateSystemStatus(data.service, data.status)
    return
  }

  // ── Announcements ─────────────────────────────────────────────
  if (category === 'announcements') {
    const data = parsed as AnnouncementData
    store.setAnnouncement(data)
    return
  }
}