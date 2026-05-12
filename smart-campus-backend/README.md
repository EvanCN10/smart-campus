# Smart Campus Backend - MQTT Simulation

Backend service untuk proyek Smart Campus Dashboard. Proyek ini berfungsi sebagai simulasi perangkat IoT (sensor lingkungan, sensor okupansi, dan sistem admin) yang mem-publish dan men-subscribe data menggunakan protokol MQTT.

## Fitur Utama

- **Environment Publisher (`publisher-env.ts`)**: Mensimulasikan sensor suhu dan kelembapan di berbagai ruangan. Menggunakan fitur MQTT QoS 0, Retained Messages, dan LWT (Last Will and Testament).
- **Occupancy Publisher (`publisher-occ.ts`)**: Mensimulasikan data kehadiran (okupansi) ruangan. Menggunakan QoS 0, Retained Messages, dan LWT.
- **Admin Publisher (`publisher-admin.ts`)**: Sistem pengelola kampus yang menyiarkan pengumuman penting (QoS 2) dan alert/peringatan keamanan (QoS 1).
- **Logger Subscriber (`subscriber-logger.ts`)**: Subscriber utilitas yang me-log aktivitas penting (peringatan dan pengumuman) ke console menggunakan Wildcard Subscription (`campus/#`).

## Prasyarat

- [Node.js](https://nodejs.org/) (Versi 18+ disarankan)
- [npm](https://www.npmjs.com/) (Biasanya sudah sepaket dengan Node.js)
- Server/Broker MQTT (Bisa menggunakan HiveMQ public broker `mqtt://broker.hivemq.com:1883` atau broker lokal seperti Mosquitto).

## Cara Menjalankan

1. **Install dependensi**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**
   Buat file `.env` di root folder ini (atau duplikat `.env.example` jika ada) dan atur URL broker MQTT. Secara default proyek akan menggunakan `mqtt://broker.hivemq.com:1883`.
   ```env
   MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
   ```

3. **Jalankan Aplikasi**
   Gunakan perintah berikut untuk menjalankan semua publisher dan subscriber secara bersamaan:
   ```bash
   npm run dev
   ```

## Struktur Topik MQTT

Proyek ini menggunakan struktur hirarki topik berikut:

- `campus/environment/+/temperature` - Data suhu
- `campus/environment/+/humidity` - Data kelembapan
- `campus/occupancy/+/capacity` - Data okupansi
- `campus/system/+/status` - Status online/offline layanan (digunakan untuk LWT)
- `campus/alerts/warning/+` - Peringatan keamanan
- `campus/announcements/broadcast` - Pengumuman sistem
