import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { AnnouncementData, SystemStatusData, AlertData } from "./types";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Admin Publisher] Menghubungkan ke ${brokerUrl}...`);

const willPayload: SystemStatusData = {
  service: "system-admin",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_admin_${Math.random().toString(16).slice(3)}`,
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

  setInterval(publishAnnouncement, 20000);
  setInterval(publishRandomAlert, 35000);
});

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
  client.publish(`campus/announcements/broadcast`, JSON.stringify(data), { qos: 2 });
  console.log(`[Admin Publisher] Published Announcement (QoS 2)`);
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

  client.publish(`campus/alerts/warning/${location.toLowerCase().replace(/\s+/g, '-')}`, JSON.stringify(data), { qos: 1 });
  console.log(`[Admin Publisher] Published Alert for ${location}`);
}
