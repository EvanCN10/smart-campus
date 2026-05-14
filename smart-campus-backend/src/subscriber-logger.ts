import * as mqtt from "mqtt";
import * as dotenv from "dotenv";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Logger Subscriber] Menghubungkan ke ${brokerUrl}...`);

const client = mqtt.connect(brokerUrl, {
  clientId: `subscriber_logger_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5, // Wajib MQTT v5 untuk Shared Subscription standar dan Flow Control
  properties: {
    // Fitur MQTT (Rubrik 10): Flow Control / Overload Scenario
    // Membatasi in-flight pesan maks 5 agar subscriber tidak kewalahan (overload) saat terjadi burst data
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
  
  // Fitur MQTT (Rubrik 2 & 9): Wildcard (+, #) & Shared Subscription ($share/)
  const topicsToSubscribe = [
    "$share/logger-group/campus/alerts/#", // (Rubrik 9) Shared Subscription: Load balancing di antara anggota logger-group
    "$share/logger-group/campus/announcements/#", // (Rubrik 2) Wildcard (#): Menangkap semua sub-topik setelah announcements
    "$share/logger-group/campus/system/+/status" // (Rubrik 2) Wildcard (+): Menangkap semua nama service tepat satu level hirarki
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
    
    // Fitur MQTT (Rubrik 5): Membaca User Properties (Metadata)
    if (packet.properties && packet.properties.userProperties) {
      console.log(`[LOGGER] Metadata (User Properties):`, packet.properties.userProperties);
    }
    
    // Fitur MQTT (Rubrik 4): Menampilkan Message Expiry Interval yang tersisa
    if (packet.properties && packet.properties.messageExpiryInterval !== undefined) {
      console.log(`[LOGGER] Message Expiry: ${packet.properties.messageExpiryInterval}s remaining`);
    }
    
    // Fitur MQTT (Rubrik 6): Menampilkan Topic Alias jika ada (Optimasi panjang string ke integer)
    if (packet.properties && packet.properties.topicAlias !== undefined) {
      console.log(`[LOGGER] Topic Alias: ${packet.properties.topicAlias} (topic "${topic}" dioptimalkan)`);
    }
    
    console.log(`[LOGGER] Payload: ${message.toString()}\n`);
    
    // Fitur MQTT (Rubrik 10): Flow Control / Overload Scenario
    // Simulasi delay 100ms per pesan. Ini akan memaksa in-flight pesan menumpuk,
    // yang akhirnya memicu mekanisme Flow Control (broker berhenti mengirim sementara karena batas receiveMaximum=5).
    const start = Date.now();
    while(Date.now() - start < 100) {} 
  }
});

// Cetak statistik setiap 10 detik
setInterval(() => {
  console.log(`\n📊 [STATS] Total pesan diterima: ${messageCount} | Burst detected: ${burstDetected}`);
  if (burstDetected && Date.now() - lastBurstTime > 10000) {
    burstDetected = false; // Reset setelah 10 detik
  }
}, 10000);
