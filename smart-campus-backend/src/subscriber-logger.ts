import * as mqtt from "mqtt";
import * as dotenv from "dotenv";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Logger Subscriber] Menghubungkan ke ${brokerUrl}...`);

const client = mqtt.connect(brokerUrl, {
  clientId: `subscriber_logger_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5, // Wajib MQTT v5 untuk Shared Subscription standar dan Flow Control
  properties: {
    // Fitur MQTT: Flow Control / Overload Scenario
    // Membatasi jumlah pesan (QoS 1/2) yang belum di-acknowledge (in-flight) maksimum 5.
    // Mencegah subscriber kewalahan saat terjadi burst data (overload).
    receiveMaximum: 5 
  }
});

// ── Statistik untuk monitoring overload ──────────────────────
let messageCount = 0;
let burstDetected = false;
let lastBurstTime = 0;
const MESSAGE_WINDOW_MS = 2000; // Window 2 detik
const BURST_THRESHOLD = 10; // Jika >10 pesan dalam 2 detik = burst
let windowStart = Date.now();
let windowMessageCount = 0;

client.on("connect", () => {
  console.log("[Logger Subscriber] Terhubung!");
  console.log("[Logger Subscriber] Flow Control: receiveMaximum = 5 (max 5 pesan QoS 1/2 in-flight)");
  
  // Fitur MQTT: Wildcard Subscription & Shared Subscription
  // Menggunakan '#' (multi-level) dan '+' (single-level) secara tepat
  // Fitur MQTT: Shared Subscription dengan prefix $share/<group-name>/
  const topicsToSubscribe = [
    "$share/logger-group/campus/alerts/#",        // Semua sub-topic alert
    "$share/logger-group/campus/announcements/#", // Semua sub-topic announcement
    "$share/logger-group/campus/system/+/status"  // Semua status dari berbagai sistem (single-level)
  ];
  
  client.subscribe(topicsToSubscribe, { qos: 1 }, (err) => {
    if (!err) {
      console.log(`[Logger Subscriber] Subscribed to topics with QoS 1:`, topicsToSubscribe);
    } else {
      console.error("[Logger Subscriber] Subscribe error:", err);
    }
  });
});

client.on("message", (topic, message, packet) => {
  messageCount++;
  
  // ── Deteksi Burst / Overload ──────────────────────────────
  const now = Date.now();
  if (now - windowStart > MESSAGE_WINDOW_MS) {
    // Reset window
    if (windowMessageCount > BURST_THRESHOLD) {
      console.log(`\n⚡ [OVERLOAD DETECTED] ${windowMessageCount} pesan dalam ${MESSAGE_WINDOW_MS}ms!`);
      console.log(`⚡ [FLOW CONTROL] Broker menahan pesan karena receiveMaximum=5.`);
      console.log(`⚡ [FLOW CONTROL] Hanya 5 pesan QoS 1/2 diproses bersamaan, sisanya mengantre.\n`);
      burstDetected = true;
      lastBurstTime = now;
    }
    windowStart = now;
    windowMessageCount = 0;
  }
  windowMessageCount++;
  
  // Log semua pesan yang masuk
  if (topic.includes("alerts") || topic.includes("announcements") || topic.includes("environment") || topic.includes("status")) {
    console.log(`[LOGGER #${messageCount}] Topic: ${topic} | QoS: ${packet.qos} | Retained: ${packet.retain}`);
    
    // Fitur MQTT: Membaca User Properties (Metadata)
    if (packet.properties && packet.properties.userProperties) {
      console.log(`[LOGGER] Metadata (User Properties):`, packet.properties.userProperties);
    }
    
    // Fitur MQTT: Menampilkan Message Expiry jika ada
    if (packet.properties && packet.properties.messageExpiryInterval !== undefined) {
      console.log(`[LOGGER] Message Expiry: ${packet.properties.messageExpiryInterval}s remaining`);
    }
    
    // Fitur MQTT: Menampilkan Topic Alias jika ada
    // Topic Alias mengoptimalkan bandwidth dengan mengganti string topic panjang menjadi integer
    if (packet.properties && packet.properties.topicAlias !== undefined) {
      console.log(`[LOGGER] Topic Alias: ${packet.properties.topicAlias} (topic "${topic}" dioptimalkan)`);
    }
    
    console.log(`[LOGGER] Payload: ${message.toString()}\n`);
    
    // Fitur MQTT: Flow Control - Simulasi slow processing
    // Sengaja delay pemrosesan untuk menunjukkan efek receiveMaximum
    // Saat burst (banyak pesan masuk sekaligus), broker akan menahan pengiriman
    // pesan baru karena subscriber belum selesai memproses (ACK tertahan)
    // NOTE: Node MQTT library auto-ACK, tapi blocking event loop ini
    // mensimulasikan subscriber yang lambat memproses
    const start = Date.now();
    while(Date.now() - start < 100) {} // Blokir 100ms per pesan
  }
});

// Cetak statistik setiap 10 detik
setInterval(() => {
  console.log(`\n📊 [STATS] Total pesan diterima: ${messageCount} | Burst detected: ${burstDetected}`);
  if (burstDetected && Date.now() - lastBurstTime > 10000) {
    burstDetected = false; // Reset setelah 10 detik
  }
}, 10000);
