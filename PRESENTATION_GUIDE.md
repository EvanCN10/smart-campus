# Smart Campus - MQTT Integration Project 🎓

Proyek ini adalah implementasi sistem pemantauan kampus cerdas (Smart Campus) berbasis arsitektur *event-driven* menggunakan protokol **MQTT**. Sistem ini terdiri dari simulasi perangkat IoT (Publisher), sistem *logging* terpusat (Subscriber), dan antarmuka interaktif secara *real-time* (Dashboard Next.js).

Proyek ini dirancang secara khusus untuk memenuhi kriteria teknis tugas MQTT.

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menjalankan Backend (Sensor & Logger)
Buka terminal baru, lalu masuk ke folder `smart-campus-backend`:
```bash
cd smart-campus-backend
npm install
npm run dev
```
*(Backend akan mulai menyimulasikan pengiriman data lingkungan, okupansi ruangan, dan status health check)*

### 2. Menjalankan Dashboard (UI Pemantauan)
Buka terminal baru lainnya, lalu masuk ke folder `smart-campus-dashboard`:
```bash
cd smart-campus-dashboard
npm install
npm run dev
```
*(Buka `http://localhost:3000` di browser untuk melihat dashboard interaktif)*

---

## 📑 Panduan Presentasi (Berdasarkan Rubrik Penilaian)

Berikut adalah panduan lengkap *(cheat sheet)* untuk presentasi. Poin-poin di bawah ini sudah memetakan kriteria rubrik langsung ke lokasi *source code*-nya, sehingga Anda tinggal membuka file terkait untuk menjelaskannya ke dosen.

### 1. Implementasi Arsitektur MQTT (25%)
- **Penjelasan:** Arsitektur memisahkan *Publisher* (sensor lingkungan, sensor okupansi, dan admin), *Broker* (menggunakan broker), dan *Subscriber* (terbagi dua: Logger di backend dan Client UI di frontend).
- **Fokus Demo:** Tunjukkan terminal berjalannya `backend` dan tampilan layar `dashboard`.

### 2. Wildcard & Topic Hierarchy (5%)
- **Penjelasan:** Menggunakan *Topic Hierarchy* yang terstruktur (contoh: `campus/system/sensor-env/status`). Wildcard `+` (Single-level) dan `#` (Multi-level) digunakan agar satu *subscriber* bisa menangkap berbagai pesan dinamis secara efisien.
- **Lokasi Kode:** `smart-campus-backend/src/subscriber-logger.ts`
  > *Tunjukkan baris:* `"$share/logger-group/campus/system/+/status"` dan `"campus/alerts/#"`

### 3. Retained Message (3%)
- **Penjelasan:** Fitur retain disetel menjadi `true` pada pengiriman status ("online"). Tujuannya efektif agar ketika Dashboard (client) baru terhubung, ia akan langsung mendapat riwayat status terakhir (terkini) tanpa perlu menunggu sensor tersebut mem-publish status lagi.
- **Lokasi Kode:** `smart-campus-backend/src/publisher-occ.ts`
  > *Tunjukkan baris pada fungsi client.publish() dengan opsi* `{ retain: true }`

### 4. Message Expiry (3%)
- **Penjelasan:** Pesan diberikan batas kedaluwarsa (`messageExpiryInterval`) berdasarkan seberapa cepat data tersebut usang. Contohnya, data jumlah orang di ruangan (okupansi) disetel kedaluwarsa dalam 30 detik.
- **Lokasi Kode:** `smart-campus-backend/src/publisher-occ.ts`
  > *Tunjukkan bagian properti:* `messageExpiryInterval: 30`

### 5. User Properties / Metadata (3%)
- **Penjelasan:** Penggunaan metadata (`userProperties`) digunakan untuk memberikan konteks ekstra secara transparan tanpa mengubah struktur JSON datanya. Metadata yang dikirim (seperti informasi `sensorType`) ditangkap secara aktif oleh Dashboard untuk interpretasi.
- **Lokasi Kode:** 
  > **Backend:** `smart-campus-backend/src/publisher-env.ts` (Tunjukkan parameter `userProperties`)
  > **Dashboard:** `smart-campus-dashboard/store/useDashboardStore.ts` (Tunjukkan baris `metadata: metadata ?? existing.metadata`)

### 6. Topic Alias (3%)
- **Penjelasan:** Menggunakan optimasi bawaan MQTT v5. String *topic* yang panjang sengaja diganti dengan ID integer (seperti `topicAlias: 1`), sehingga sangat menghemat *bandwidth* pada publikasi data repetitif yang dikirimkan tiap detik.
- **Lokasi Kode:** `smart-campus-backend/src/publisher-env.ts`
  > *Tunjukkan bagian properti:* `topicAlias: 1`

### 7. Last Will and Testament / LWT (3%)
- **Penjelasan:** Fitur proteksi *disconnect*. Jika koneksi Publisher terputus tiba-tiba secara paksa, Broker akan secara otomatis mengirimkan payload `status: offline` ke klien yang lain (Dashboard).
- **Lokasi Kode:** `smart-campus-backend/src/publisher-admin.ts`
  > *Tunjukkan bagian konfigurasi* `will: { ... }` *pada inisiasi `mqtt.connect()`*

### 8. Request-Response Pattern (10%)
- **Penjelasan:** Backend Admin mengirim sebuah pesan *Health Check Request* sambil menyertakan `responseTopic` dan ID `correlationData`. Saat *Publisher Env* menerima request tersebut, ia merespon tepat sasaran ke `responseTopic` yang diminta, serta mengirim balik ID `correlationData` agar Admin bisa memvalidasinya dengan benar.
- **Lokasi Kode:** Buka berdampingan (split-screen) `publisher-admin.ts` dan `publisher-env.ts`. Tunjukkan jalurnya.

### 9. Shared Subscription (5%)
- **Penjelasan:** Mengimplementasikan fitur *Load Balancing*. Jika kita menjalankan banyak proses Logger sekaligus, beban pesan (misalnya pesan *alerts*) yang masuk tidak akan diduplikasi secara sia-sia, melainkan dibagi merata antar proses logger di dalam grup yang sama.
- **Lokasi Kode:** `smart-campus-backend/src/subscriber-logger.ts`
  > *Tunjukkan adanya prefix* `$share/logger-group/...` *pada saat `.subscribe()`*

### 10. Flow Control / Overload Scenario (5%)
- **Penjelasan:** Mencegah sistem penerima (Logger) mati karena kebanjiran trafik (overload). Pesan dari broker dibatasi maksimal 5 secara bersamaan *(in-flight)*. Jika lebih, broker akan disuruh "menahan pesannya" (Flow control aktif).
- **Lokasi Kode:** `smart-campus-backend/src/subscriber-logger.ts`
  > *Tunjukkan konfigurasi awal* `receiveMaximum: 5` *dan blok logika delay/pause di kodenya.*

### 11. Dashboard Monitoring (10%)
- **Penjelasan:** Visualisasinya informatif, interaktif, dan bersih. Memiliki filter (*Room Filter*), Panel *Control* interaktif, *System Status* dari LWT, indikator jumlah ruangan, *alert*, dsb.
- **Fokus Demo:** Tunjukkan Web UI, coba berinteraksi dengan menekan filter ruangan (*Lab A*, *Perpustakaan*), modal alert, dan lihat grafiknya berjalan real-time.
