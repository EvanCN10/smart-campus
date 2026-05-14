# Smart Campus - MQTT Integration Project 🎓

**👥 Pembagian Peran Tim:**
- 👨‍💻 **Yazid (Backend Engineer)**: Bertanggung jawab atas arsitektur MQTT, Node.js Publisher, Subscriber Logger, skenario Overload/Flow Control, dan mekanisme Event-Driven menggunakan fitur-fitur MQTT v5.
- 👨‍🎨 **Evan (Frontend Engineer)**: Bertanggung jawab atas pengembangan UI/UX Dashboard Next.js, interaktivitas halaman, dan pengolahan *state management* MQTT Client (menerjemahkan data *backend* ke representasi visual).

Proyek ini dirancang secara khusus untuk memenuhi 11 kriteria teknis presentasi arsitektur MQTT kampus.

---

## 🎬 Skenario Demo Live (Langkah demi Langkah)

Untuk mendemonstrasikan kapabilitas sistem secara komprehensif, implementasikan urutan pengujian berikut:

1. **Konfigurasi Tampilan Split-Screen:** Jalankan Terminal Backend di paruh layar kiri untuk menampilkan log sistem, dan Browser Dashboard di paruh layar kanan.
2. **Pengujian Flow Control (Rubrik 10):** Tampilkan log pada terminal logger. Observasi mekanisme *Subscriber Logger* dalam membatasi laju penerimaan pesan menggunakan parameter `receiveMaximum: 5`.
3. **Simulasi Last Will and Testament / LWT (Rubrik 7):** Lakukan terminasi paksa (`Ctrl + C`) pada terminal backend. Observasi perubahan *state* pada panel **System Status** di Dashboard yang secara otomatis mendeteksi status **"Offline"**. Hal ini memvalidasi berjalannya mekanisme LWT dari broker MQTT.
4. **Inspeksi Metadata & Filter (Rubrik 5 & 11):** Tampilkan peringatan darurat (Alerts) pada Dashboard. Validasi bahwa informasi detail terkait sumber peringatan diekstraksi dari *User Properties* MQTT v5 secara dinamis.
5. **Inspeksi Kode:** Gunakan dokumen `PRESENTATION_GUIDE.md` ini sebagai rujukan kode. Tautan *Potongan Kode* telah disediakan untuk mengarahkan penguji ke spesifikasi implementasi tiap fitur.

---

## 🚀 Panduan Eksekusi Sistem

### 1. Menjalankan Backend (Lingkungan Yazid)
Buka terminal baru, navigasikan ke direktori `smart-campus-backend`, dan jalankan perintah:
```bash
npm install
npm run dev
```

**💡 Ekspektasi Output Terminal Backend:**
```text
[Logger Subscriber] Terhubung ke broker MQTT.
[Logger Subscriber] Flow Control: receiveMaximum = 5 (max 5 pesan QoS 1/2 in-flight)
[Occ Publisher] Terhubung ke broker. Mengirim data okupansi...
[Env Publisher] Terhubung ke broker. Mengirim data lingkungan...
[LOGGER] Menerima pesan di campus/system/sensor-env/status
[LOGGER] Metadata (User Properties): { sensorType: 'environment', locationBuilding: 'Gedung C' }
[LOGGER] Message Expiry: 60s remaining
[LOGGER] Topic Alias: 1 (topic "campus/sensor/environment" dioptimalkan)
```

### 2. Menjalankan Dashboard (Lingkungan Evan)
Buka terminal baru, navigasikan ke direktori `smart-campus-dashboard`, dan jalankan perintah:
```bash
npm install
npm run dev
```
*(Akses `http://localhost:3000` melalui *browser* untuk memantau dashboard yang berinteraksi dengan data dari Backend)*

---

## 📊 Tabel Rubrik Penilaian (Referensi)

Tabel berikut memetakan kriteria penilaian dengan implementasi sistem yang telah dikembangkan:

| No | Kriteria Penilaian | Bobot | Target Implementasi & Penilaian |
|:---|:---|:---|:---|
| 1 | Implementasi Arsitektur MQTT | 25% | Arsitektur diimplementasikan secara terstruktur, terukur, dan merepresentasikan kasus penggunaan sistem *Smart Campus* nyata. |
| 2 | Wildcard & Topic Hierarchy | 5% | Hierarki topik dirancang *scalable* dengan pemanfaatan `+` dan `#` yang sesuai standar. |
| 3 | Retained Message | 3% | Implementasi *Retained Message* untuk memastikan ketersediaan data *state* terakhir bagi *subscriber* baru. |
| 4 | Message Expiry | 3% | Pemanfaatan *Message Expiry* untuk otomatisasi pembersihan pesan usang berbasis *lifecycle event*. |
| 5 | User Properties (Metadata) | 3% | Penggunaan metadata dinamis untuk klasifikasi dan pemrosesan pesan tambahan tanpa modifikasi payload. |
| 6 | Topic Alias | 3% | Optimasi penggunaan *bandwidth* melalui reduksi ukuran topik menggunakan *Topic Alias*. |
| 7 | Last Will and Testament (LWT) | 3% | Implementasi deteksi kegagalan layanan secara *real-time* menggunakan LWT. |
| 8 | Request-Response Pattern | 10% | Mekanisme komunikasi sinkron dua arah dalam arsitektur asinkron MQTT. |
| 9 | Shared Subscription | 5% | Distribusi beban secara merata (*load balancing*) di antara grup *subscriber*. |
| 10 | Flow Control / Overload Scenario | 5% | Pengendalian laju pesan (`receiveMaximum`) serta simulasi penanganan kondisi sistem *overload*. |
| 11 | Dashboard Monitoring | 10% | Antarmuka pengguna interaktif, informatif, dan terintegrasi secara asinkron dengan broker. |
| 12 | Presentasi & Pemahaman Konsep | 25% | Penguasaan komprehensif terhadap arsitektur teknis dan detail *source code*. |

---

## 📑 Pemetaan Teknis Berdasarkan Rubrik

Bagian ini menguraikan penjelasan analitis dan teknis dari tiap fitur beserta tautan langsung ke implementasi kode terkait.

### 1. Implementasi Arsitektur MQTT (25%)
- **Requirement Rubrik:** *Arsitektur kreatif, sistematis, dan menyerupai sistem nyata.*
- **Deskripsi Teknis:** Arsitektur sistem mengadopsi pola mikrolayanan (*microservices*) terdistribusi yang memodelkan infrastruktur *Smart Campus* secara realistis. Ekosistem dipisahkan menjadi beberapa entitas independen: tiga instans *Publisher* khusus (sensor lingkungan, monitor okupansi, dan panel administratif), sebuah *Subscriber Logger* yang berfungsi sebagai sistem agregasi *backend*, serta Visual Dashboard modern berbasis Next.js untuk monitoring *real-time*.

### 2. Wildcard & Topic Hierarchy (5%)
- **Requirement Rubrik:** *Topic hierarchy scalable, rapi, dan menggunakan + dan # secara tepat.*
- **Deskripsi Teknis:** Hierarki topik dirancang dengan prinsip perluasan dinamis. Pemanfaatan *Single-level Wildcard* (`+`) digunakan untuk memantau status spesifik dari berbagai layanan pada tingkat struktural yang sama, sementara *Multi-level Wildcard* (`#`) diterapkan untuk menangkap semua variasi kejadian (*alerts*) di bawah *namespace* kampus. Hal ini memastikan penambahan titik sensor baru dapat diakomodasi tanpa memerlukan modifikasi pada kode layanan yang sudah berjalan.
- **Potongan Kode ([subscriber-logger.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/subscriber-logger.ts)):**
  ```typescript
  client.on("connect", () => {
    const topicsToSubscribe = [
      // '#' Mengambil seluruh tingkatan sub-topik alerts
      "$share/logger-group/campus/alerts/#",
      // '+' Mengidentifikasi entitas layanan apapun pada hierarki saat ini
      "$share/logger-group/campus/system/+/status"
    ];
    
    client.subscribe(topicsToSubscribe, { qos: 1 }, (err) => {
      if (!err) console.log(`Subscribed to topics:`, topicsToSubscribe);
    });
  });
  ```

### 3. Retained Message (3%)
- **Requirement Rubrik:** *Retained digunakan efektif dengan alasan yang tepat.*
- **Deskripsi Teknis:** *Retained Message* diaplikasikan pada transmisi metrik telemetri kritis (seperti suhu dan tingkat okupansi) untuk mengeliminasi latensi inisialisasi pada *client* sisi *frontend*. Saat *client* baru terhubung, broker secara otomatis mendistribusikan *state* data terakhir tanpa harus menunggu siklus *publish* dari sensor selanjutnya, sehingga memastikan representasi visual pada Dashboard tersedia seketika (*instant-load*).
- **Potongan Kode ([publisher-env.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/publisher-env.ts)):**
  ```typescript
  // Publish nilai parameter lingkungan dengan flag Retain True
  client.publish(`campus/environment/${room.id}/temperature`, JSON.stringify(temp), { 
    qos: 0, 
    retain: true,
    properties: {
      ...commonProperties,
      topicAlias: 1 
    }
  });
  ```

### 4. Message Expiry (3%)
- **Requirement Rubrik:** *Expiry digunakan tepat sesuai lifecycle event dan terlihat dampaknya.*
- **Deskripsi Teknis:** Mekanisme *Message Expiry* dimanfaatkan untuk mengelola siklus hidup informasi sementara, seperti pengumuman administratif atau *alert* minor. Dengan mengonfigurasi batas interval kedaluwarsa pada level paket broker, pesan-pesan yang tidak sempat tersampaikan dalam jendela waktu yang ditentukan akan dihapus secara otomatis. Ini mencegah adanya akumulasi data usang (*stale data*) yang tidak lagi relevan ketika koneksi jaringan dari *client* kembali pulih.
- **Justifikasi Penggunaan QoS 2:** Pada transmisi pengumuman (*announcements*), tingkat `qos: 2` (*Exactly Once*) diterapkan secara spesifik untuk memberikan garansi absolut bahwa pesan penting dari admin pasti tersampaikan tanpa risiko duplikasi. Hal ini memitigasi anomali visual pada *Dashboard*, seperti kemunculan *pop-up alert* yang bertumpuk akibat penerimaan pesan ganda (sebagaimana yang rentan terjadi pada QoS 1).
- macam macam QOS : terdapat 3 level QoS:

1. QoS 0: At most once (Maksimal Sekali / "Fire and Forget")
Cara Kerja: Pengirim hanya mengirim pesan sekali dan tidak peduli apakah pesannya sampai atau hilang di jalan. Tidak ada konfirmasi balasan (acknowledgement).
Analogi: Seperti melempar koran ke halaman rumah orang. Bisa jadi korannya dibaca, atau bisa juga terbawa angin/dicuri orang. Kamu tidak ngecek lagi.
Kapan digunakan? Untuk data yang sangat sering dikirim dan kehilangan 1-2 data tidak masalah. Contoh: Sensor suhu yang mengirim data setiap 1 detik. Kalau gagal kirim di detik ke-5, ya sudah tunggu saja data detik ke-6.
2. QoS 1: At least once (Minimal Sekali)
Cara Kerja: Pengirim akan mengirim pesan dan menunggu konfirmasi (PUBACK) dari Broker. Jika konfirmasi tidak kunjung datang, pengirim akan terus mengirim ulang pesan tersebut sampai mendapat konfirmasi.
Kelemahan: Karena dikirim berkali-kali jika tidak ada konfirmasi, penerima mungkin bisa mendapatkan pesan ganda / duplikat.
Analogi: Seperti mengirim paket lewat kurir dan minta resi. Kalau kurir tidak kasih kabar, kamu kirim paket yang sama lagi. Akibatnya penerima bisa dapat 2 paket yang sama.
Kapan digunakan? Untuk data penting yang harus sampai, tetapi aplikasimu punya cara untuk membuang/mengabaikan jika ada data kembar yang masuk.
3. QoS 2: Exactly once (Tepat Sekali) 
Cara Kerja: Ini adalah tingkat garansi tertinggi (paling aman, tapi paling lambat/berat). MQTT menggunakan sistem pertukaran 4 langkah (kirim -> terima -> rilis -> selesai) untuk menjamin pesan pasti sampai, dan dijamin tidak akan ganda (duplikat).
Analogi: Seperti mengirim surat tercatat yang mengharuskan si penerima tanda tangan basah, lalu si kurir kembali membawa bukti tanda tangan itu padamu sebelum transaksinya dianggap selesai.
Kapan digunakan? Digunakan pada sistem yang sangat kritikal, seperti transaksi keuangan (sistem pembayaran), atau sistem kontrol di mana 1 perintah pantang untuk dijalankan 2 kali.
- **Potongan Kode ([publisher-admin.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/publisher-admin.ts)):**
  ```typescript
  // Transmisi siaran administratif
  client.publish(`campus/announcements/broadcast`, Buffer.from(JSON.stringify(data)), {
    qos: 2,
    properties: {
      // (Rubrik 4) Delegasi ke broker untuk membuang paket setelah lewat 120 detik
      messageExpiryInterval: 120, 
      userProperties: {
        'source': 'admin-service',
        'priority': 'normal',
      }
    }
  });
  ```

### 5. User Properties / Metadata (3%)
- **Requirement Rubrik:** *Metadata digunakan aktif untuk interpretasi dan keputusan sistem.*
- **Deskripsi Teknis:** *User Properties* pada standar MQTT v5 diimplementasikan guna memberikan pengayaan konteks pesan tanpa merusak struktur *payload* JSON. Label metadata komprehensif, seperti penanda spesifikasi perangkat atau koordinat gedung geografis disematkan pada struktur *header*. Pendekatan ini memungkinkan *subscriber* (terutama komponen filter di *Dashboard*) untuk melakukan inspeksi bersyarat dan kategorisasi sebelum pesan *payload* sepenuhnya diurai.
- **Potongan Kode ([publisher-env.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/publisher-env.ts)):**
  ```typescript
  const commonProperties = {
    messageExpiryInterval: 60, 
    userProperties: { 
      // (Rubrik 5) Injeksi Metadata komprehensif pada level struktur Header
      'sensor-type': 'DHT22',
      'location-building': 'Gedung Utama',
    }
  };

  client.publish(`campus/environment/${room.id}/temperature`, JSON.stringify(temp), { 
    properties: {
      ...commonProperties,
      topicAlias: 1 
    }
  });
  ```

### 6. Topic Alias (3%)
- **Requirement Rubrik:** *Alias digunakan tepat untuk optimasi topic panjang.*
- **Deskripsi Teknis:** Guna meminimalkan konsumsi *bandwidth* dari transmisi periodik, fitur *Topic Alias* telah direalisasikan. Proses pemetaan (*mapping*) string topik hierarkis ke sebuah indeks numerik divalidasi pada pengiriman awal pesan. Untuk seluruh transmisi reguler berikutnya, ukuran paket komunikasi ditekan drastis dengan mendayagunakan indeks tersebut. Fitur optimasi ini vital pada simulasi *IoT edge networking* yang identik dengan konstrain sumber daya.
- **Potongan Kode ([publisher-env.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/publisher-env.ts)):**
  ```typescript
  client.publish(`campus/environment/${room.id}/temperature`, JSON.stringify(temp), { 
    qos: 0, 
    retain: true,
    properties: {
      ...commonProperties,
      // (Rubrik 6) Substitusi representasi string topic yang panjang menjadi integer '1'
      topicAlias: 1 
    }
  });
  ```

### 7. Last Will and Testament / LWT (3%)
- **Requirement Rubrik:** *Penggunaan LWT tepat.*
- **Deskripsi Teknis:** Keandalan operasional (*Fault Tolerance*) sistem pemantauan direalisasikan lewat konfigurasi *Last Will and Testament*. Broker diprogram secara pradefinisi agar merilis notifikasi kegagalan bersistem ketika suatu interupsi diskoneksi tak terduga (*unexpected disconnections*) terjadi di sisi *publisher*. Ini memberikan sinyal pemicu *real-time* kepada *Dashboard UI* untuk menyesuaikan tampilan indikator kejanggalan secara otonom.
- **Potongan Kode ([publisher-admin.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/publisher-admin.ts)):**
  ```typescript
  // Deklarasi manifest LWT selama inisiasi handshake koneksi
  const willPayload = { service: "system-admin", status: "offline", timestamp: new Date().toISOString() };

  const client = mqtt.connect(brokerUrl, {
    protocolVersion: 5, 
    will: {
      topic: "campus/system/system-admin/status",
      payload: JSON.stringify(willPayload),
      qos: 1,
      retain: true, // Persistensi flag kegagalan (Offline State) di level Broker
    },
  });
  ```

### 8. Request-Response Pattern (10%)
- **Requirement Rubrik:** *Request-response berjalan baik dan implementasinya tepat.*
- **Deskripsi Teknis:** Pola asinkron murni MQTT diadaptasi agar dapat mendukung pola pertukaran komunikasi sinkron dua arah (pola *RPC-like*). *Publisher* (Admin) memicu permintaan (*health-check*) dengan menyertakan instruksi resolusi rute pulangan (`responseTopic`) serta pengenal pelacakan transaksi unik (`correlationData`). Mekanisme ini menjamin bahwa layanan target merespons kueri diagnostik langsung secara akurat kepada pihak inisiator tanpa menyebabkan ambiguitas data (berkat validasi korelasi permintaan dan balasan).
- **Istilah Kunci:**
  - **`responseTopic` (Alamat Balasan):** Properti MQTT v5 yang memberitahu *Responder* ke topik mana mereka harus membalas. Ini seperti menuliskan alamat pengirim di amplop agar penerima tahu ke mana harus mengirim jawaban.
  - **`correlationData` (ID Korelasi):** Token unik (seperti nomor resi) yang dikirim oleh *Requester*. *Responder* wajib mengembalikan token yang sama agar *Requester* tahu balasan tersebut adalah untuk permintaan yang mana.
- **Ekspektasi Output Terminal:**
  ```text
  [Admin Publisher] Mengirim request health check (Correlation ID: req-1715500000000)...
  [Env Publisher] Menerima request health-check! Membalas ke: campus/system/response/health
  [Admin Publisher] Menerima balasan (Response) dari req-1715500000000:
  Payload: {"status":"ok"}
  ```
- **Potongan Kode:**
  ```typescript
  // --- INITIATOR NODE (Transmisi request dengan referensi rute pulangan) ---
  client.publish("campus/system/request/health", Buffer.from(JSON.stringify({ type: "health-check" })), {
    properties: {
      responseTopic: "campus/system/response/health",
      correlationData: Buffer.from("req-12345") // Identifikasi unik transaksional
    }
  });

  // --- RESPONDER NODE (Penanganan & Eksekusi resolusi rute) ---
  client.on("message", (topic, message, packet) => {
    if (topic === "campus/system/request/health") {
      const responseTopic = packet.properties?.responseTopic;
      const correlationData = packet.properties?.correlationData;
      
      // Mengirimkan balasan ke direktori rute dan mengembalikan referensi korelasi
      if (responseTopic && correlationData) {
        client.publish(responseTopic, JSON.stringify({ status: "ok" }), {
          properties: { correlationData: correlationData }
        });
      }
    }
  });
  ```

### 9. Shared Subscription (5%)
- **Requirement Rubrik:** *Penggunaan load balancing antar subscriber dengan alasan yang tepat.*
- **Deskripsi Teknis:** Topologi pemrosesan pesan divirtualisasikan agar mampu didistribusikan (*Load Balanced*) menggunakan prefix `$share/`. Implementasi ini berfungsi untuk mendistribusikan volume transmisi telemetri log ke beberapa instans layanan secara bergantian berdasarkan algoritma *round-robin*. Solusi operasional ini memitigasi anomali *Bottleneck* pemrosesan ketika terjadi eskalasi trafik dan mencegah redundansi observasi event yang sama.
- **Potongan Kode ([subscriber-logger.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/subscriber-logger.ts)):**
  ```typescript
  client.on("connect", () => {
    // Implementasi mekanisme pendistribusian trafik ke dalam kluster konseptual 'logger-group'
    const topicsToSubscribe = [
      "$share/logger-group/campus/alerts/#", 
      "$share/logger-group/campus/announcements/#"
    ];
    
    client.subscribe(topicsToSubscribe, { qos: 1 });
  });
  ```

### 10. Flow Control / Overload Scenario (5%)
- **Requirement Rubrik:** *Penggunaan flow control dengan tepat dan ada simulasi sistem overload.*
- **Deskripsi Teknis:** Resiliensi layanan penerima dijamin ketersediaannya melintasi lonjakan aktivitas trafik (*burst data*) dengan memanfaatkan kemampuan *Flow Control* MQTT v5. Parameter laju alokasi (`receiveMaximum: 5`) digunakan secara ketat untuk mendikte batas kuota maksimal pesan yang boleh diproses secara bersamaan (*in-flight*) oleh penerima. Untuk menguji fitur ini, blokade siklus asinkron (simulasi *delay* lambat) sengaja disuntikkan ke dalam skrip logger. Akibatnya, saat volume data membengkak, Broker otomatis akan menahan (*throttle*) laju pesan masuk, mencegah terjadinya penumpukan memori (OOM) atau *crash* pada *subscriber*.
- **Istilah Kunci:**
  - **In-flight (Pesan dalam Perjalanan):** Status pesan yang sudah terkirim tapi belum menerima konfirmasi balasan (*acknowledgment*) dari penerima. Fitur *Flow Control* membatasi jumlah pesan *in-flight* ini agar *subscriber* tidak kewalahan.
- **Ekspektasi Output Terminal (Saat Overload):**
  ```text
  [Logger Subscriber] Terhubung! Flow Control: receiveMaximum = 5 (max 5 pesan in-flight)
  [Logger Subscriber] ⚠️ PERINGATAN: Terdeteksi lonjakan trafik (>10 pesan dalam 2 detik).
  [Logger Subscriber] Melakukan throttled processing... Broker menahan laju pesan masuk.
  [Logger Subscriber] Menyelesaikan batch (5 pesan)... Melanjutkan aliran dari broker.
  ```
- **Potongan Kode ([subscriber-logger.ts](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-backend/src/subscriber-logger.ts)):**
  ```typescript
  // Konfigurasi regulasi antrian untuk mitigasi kapasitas memori
  const client = mqtt.connect(brokerUrl, {
    protocolVersion: 5, 
    properties: {
      receiveMaximum: 5 // Pembatasan kuota jendela pemrosesan konkuren in-flight
    }
  });

  client.on("message", (topic, message) => {
    // Sinkronisasi pemrosesan buatan (100ms per blokade siklus instruksi)
    // Berfungsi mendemonstrasikan peredaman lalu lintas pengiriman data dari Broker
    const start = Date.now();
    while(Date.now() - start < 100) {} 
  });
  ```

### 11. Dashboard Monitoring (10%)
- **Requirement Rubrik:** *Informatif, bersih, dan mencakup kontrol interaktif.*
- **Deskripsi Teknis:** Intermuka *Dashboard* dibangun menggunakan arsitektur reaktif Next.js yang disinergikan bersama sistem manajemen *state* terpusat (Zustand). Arsitektur tersebut memfasilitasi injeksi asinkron serta visualisasi pemutakhiran telemetri (*real-time dashboarding*). Secara komprehensif, panel antarmuka menyuguhkan interaksi *filtering* multidimensi, deteksi diagnostik LWT termutakhir, serta perenderan grafik parametrik dinamis yang tersinkronisasi murni oleh pasokan data di jalur distribusi broker.
- **Potongan Kode (Dashboard):**
  - **Reaktivitas Panel Status LWT:** [`SystemStatusPanel.tsx`](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-dashboard/src/components/SystemStatusPanel.tsx) (Integrasi observasi detak jantung kegagalan sistem broker).
  - **Struktur State MQTT Client:** [`mqttStore.ts`](file:///c:/Users/ahmad/Documents/1_its/sem4/integrasi-sistem/tugas-4/smart-campus-dashboard/src/store/mqttStore.ts) (Orkestrasi alur persisten telemetri dan abstraksi peristiwa *Alerts*).
- **Aktivitas Teknis Presentasi:** Demonstrasikan fungsionalitas panel manipulasi parameter spasial (Filter Ruangan), perubahan responsif pada metrik visual, dan interpretasi struktur *User Properties* melalui log interaksi notifikasi sistem.

### 12. Presentasi & Pemahaman Konsep (25%)
- **Requirement Rubrik:** *Penjelasan sangat teknis, baik, dan menguasai kode.*
- **Deskripsi Teknis:** Presentasi dirancang menggunakan pendekatan metodologi perbandingan komparatif dengan *setup* demonstrasi *Split-Screen*. Konfigurasi ini secara empiris membuktikan bahwa fluktuasi metrik operasional serta peringatan anomali pada sisi front-end terjadi akibat aktivitas komunikasi data aktual dari abstraksi protokol MQTT di sistem peladen (*broker*), tanpa adanya injeksi skenario *hardcoded*. Modul referensi dokumen ini secara ketat merunut struktur korelasi kode untuk mempertanggungjawabkan perancangan logika yang telah dibangun.
