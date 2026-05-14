import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { AnnouncementData, SystemStatusData, AlertData } from "./types";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Admin Publisher] Menghubungkan ke ${brokerUrl}...`);

// Fitur MQTT (Rubrik 7 & 3): Last Will and Testament (LWT) dengan Retained Message
const willPayload: SystemStatusData = {
  service: "system-admin",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_admin_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5, // MQTT v5 untuk mendukung user properties dan request-response
  will: {
    topic: "campus/system/system-admin/status",
    payload: JSON.stringify(willPayload),
    qos: 1,
    retain: true,
  },
});

client.on("connect", () => {
  console.log("[Admin Publisher] Terhubung!");

  const onlinePayload: SystemStatusData = {
    service: "system-admin",
    status: "online",
    timestamp: new Date().toISOString(),
  };
  client.publish("campus/system/system-admin/status", JSON.stringify(onlinePayload), { qos: 1, retain: true });

  // Fitur MQTT (Rubrik 8): Request-Response Pattern (Subscribe ke topik balasan)
  // Menangkap response dari service lain berdasarkan correlationData
  client.subscribe("campus/system/response/health");

  setInterval(publishAnnouncement, 20000);
  setInterval(publishRandomAlert, 35000);

  // Kirim request health check setiap 15 detik
  setInterval(requestHealthCheck, 15000);
});

client.on("message", (topic, message, packet) => {
  if (topic === "campus/system/response/health") {
    console.log(`\n[Admin Publisher] Menerima balasan (Response) dari ${packet.properties?.correlationData}:`);
    console.log(`Payload: ${message.toString()}`);
  }
});

function requestHealthCheck() {
  const correlationData = `req-${Date.now()}`;
  console.log(`\n[Admin Publisher] Mengirim request health check (Correlation ID: ${correlationData})...`);

  // Fitur MQTT (Rubrik 8): Request-Response Pattern
  // Mengirim pesan request dan menyertakan topik balasan (responseTopic) serta ID korelasi (correlationData)
  client.publish("campus/system/request/health", Buffer.from(JSON.stringify({ type: "health-check" })), {
    qos: 1,
    properties: {
      responseTopic: "campus/system/response/health",
      correlationData: Buffer.from(correlationData)
    }
  });
}

function publishAnnouncement() {
  const messages = [
    "Perawatan jaringan kampus akan dilakukan jam 23:00.",
    "Jangan lupa mengisi kuesioner evaluasi dosen di sistem akademik.",
    "Batas akhir pembayaran UKT adalah besok siang.",
  ];

  const data: AnnouncementData = {
    title: "Informasi Kampus",
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date().toISOString(),
  };

  // Fitur MQTT: QoS 2 (Exactly once) untuk pesan penting seperti pengumuman
  // Fitur MQTT (Rubrik 4 & 5): Message Expiry & User Properties
  client.publish(`campus/announcements/broadcast`, Buffer.from(JSON.stringify(data)), {
    qos: 2,
    properties: {
      messageExpiryInterval: 120, // (Rubrik 4) Pengumuman kadaluarsa dalam 2 menit agar tidak tertahan terlalu lama jika broker mati
      userProperties: { // (Rubrik 5) Metadata sumber pengumuman untuk mempermudah interpretasi
        'source': 'admin-service',
        'priority': 'normal',
      }
    }
  });
  console.log(`[Admin Publisher] Published Announcement (QoS 2, Expiry: 120s)`);
}

function publishRandomAlert() {
  const rooms = ["Lab A", "Ruang Kelas B", "Perpustakaan"];
  const location = rooms[Math.floor(Math.random() * rooms.length)];

  const data: AlertData = {
    id: `alert-${Date.now()}`,
    severity: "warning",
    location,
    message: `Aktivitas mencurigakan terdeteksi di luar jam operasional pada ${location}.`,
    timestamp: new Date().toISOString(),
  };

  // Fitur MQTT: Message Expiry — alert kadaluarsa dalam 90 detik
  client.publish(`campus/alerts/warning/${location.toLowerCase().replace(/\s+/g, '-')}`, Buffer.from(JSON.stringify(data)), {
    qos: 1,
    properties: {
      messageExpiryInterval: 90, // Alert kadaluarsa dalam 90 detik
      userProperties: {
        'source': 'security-system',
        'zone': 'campus-main',
      }
    }
  });
  console.log(`[Admin Publisher] Published Alert for ${location} (Expiry: 90s)`);
}
