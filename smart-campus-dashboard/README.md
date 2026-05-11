# Smart Campus Dashboard (Frontend)

Dashboard monitoring real-time berbasis Next.js (App Router) yang menerima data via MQTT (WebSocket).

## Prasyarat

- Node.js (disarankan LTS)
- pnpm

## Menjalankan Lokal

1. Install dependency:

```bash
pnpm install
```

2. Siapkan env:

```bash
copy .env.example .env.local
```

3. Jalankan:

```bash
pnpm dev
```

Buka http://localhost:3000

## Konfigurasi MQTT

- `NEXT_PUBLIC_MQTT_BROKER_URL`
  - Default (dev): `wss://broker.hivemq.com:8884/mqtt`
  - Diset di `.env.local` (jangan di-commit).

Frontend subscribe ke:

- `campus/#`

## Kontrak Topic & Payload

Catatan penting: frontend mengharapkan payload **JSON valid** (bukan string seperti `READY`).

Topic yang dipahami frontend:

- Environment: `campus/environment/{roomId}/{metric}`
  - `metric`: `temperature` | `humidity` | `air-quality`
- Occupancy: `campus/occupancy/{roomId}/count`
- Alerts: `campus/alerts/{severity}/{location}`
  - `severity`: `critical` | `warning` | `info`
- System status: `campus/system/...` (payload berisi `service` dan `status`)
- Announcement: `campus/announcements/...`

Contoh payload (Environment):

```json
{
  "value": 28.5,
  "unit": "C",
  "roomId": "room-a",
  "roomName": "Lab A",
  "timestamp": "2026-05-11T10:20:30.000Z"
}
```

Struktur type lengkap ada di `lib/types.ts`.
