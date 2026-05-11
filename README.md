# Smart Campus Monitoring (Monorepo)

Repo ini berisi:

- `smart-campus-dashboard/` — frontend (Next.js) untuk monitoring real-time via MQTT.
- `smart-campus-backend/` — backend (akan dikerjakan terpisah oleh tim/teman).

## Cara Menjalankan Frontend

```bash
cd smart-campus-dashboard
pnpm install
copy .env.example .env.local
pnpm dev
```

Buka http://localhost:3000

## Catatan Struktur Backend

Folder `smart-campus-backend/` sengaja disiapkan untuk diisi service publisher MQTT (sensor simulator, microservice, dsb).
Kontrak topic/payload yang diharapkan frontend didokumentasikan di `smart-campus-dashboard/README.md`.
