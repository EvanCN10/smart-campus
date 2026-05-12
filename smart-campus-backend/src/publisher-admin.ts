import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { AnnouncementData, SystemStatusData, AlertData } from "./types";

dotenv.config();

const brokerUrl =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Admin Publisher] Menghubungkan ke ${brokerUrl}...`);

// Flow Control / Overload Scenario (minimal)
const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT ?? 20);
const ADMIN_ANNOUNCE_INTERVAL_MS = Number(
  process.env.ADMIN_ANNOUNCE_INTERVAL_MS ?? 20000,
);
const ADMIN_ALERT_INTERVAL_MS = Number(
  process.env.ADMIN_ALERT_INTERVAL_MS ?? 35000,
);
let inflight = 0;

const willPayload: SystemStatusData = {
  service: "system-admin",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_admin_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5,
  properties: {
    topicAliasMaximum: 10,
  },
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
  client.publish(
    "campus/system/system-admin/status",
    JSON.stringify(onlinePayload),
    {
      qos: 1,
      retain: true,
      properties: {
        topicAlias: 3,
        userProperties: {
          source: "publisher-admin",
          service: "system-admin",
          kind: "system-status",
        },
      },
    },
  );

  setInterval(publishAnnouncement, ADMIN_ANNOUNCE_INTERVAL_MS);
  setInterval(publishRandomAlert, ADMIN_ALERT_INTERVAL_MS);
});

function publishAnnouncement() {
  if (!client.connected) return;
  if (inflight >= MAX_INFLIGHT) {
    console.log(
      `[Admin Publisher] FlowControl: skip announcement (inflight=${inflight})`,
    );
    return;
  }

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
  inflight++;
  client.publish(
    `campus/announcements/broadcast`,
    JSON.stringify(data),
    {
      qos: 2,
      properties: {
        // Rubric: Message Expiry
        messageExpiryInterval: 300,
        // Rubric: User Properties
        userProperties: {
          source: "publisher-admin",
          kind: "announcement",
        },
      },
    },
    (err) => {
      inflight = Math.max(0, inflight - 1);
      if (err) {
        console.error("[Admin Publisher] Publish announcement error:", err);
      }
    },
  );
  console.log(`[Admin Publisher] Published Announcement (QoS 2)`);
}

function publishRandomAlert() {
  if (!client.connected) return;
  if (inflight >= MAX_INFLIGHT) {
    console.log(
      `[Admin Publisher] FlowControl: skip alert (inflight=${inflight})`,
    );
    return;
  }

  const rooms = ["Lab A", "Ruang Kelas B", "Perpustakaan"];
  const location = rooms[Math.floor(Math.random() * rooms.length)];

  const data: AlertData = {
    id: `alert-${Date.now()}`,
    severity: "warning",
    location,
    message: `Aktivitas mencurigakan terdeteksi di luar jam operasional pada ${location}.`,
    timestamp: new Date().toISOString(),
  };

  inflight++;
  client.publish(
    `campus/alerts/warning/${location.toLowerCase().replace(/\s+/g, "-")}`,
    JSON.stringify(data),
    {
      qos: 1,
      properties: {
        messageExpiryInterval: 120,
        userProperties: {
          source: "publisher-admin",
          kind: "alert",
          severity: data.severity,
        },
      },
    },
    (err) => {
      inflight = Math.max(0, inflight - 1);
      if (err) {
        console.error("[Admin Publisher] Publish alert error:", err);
      }
    },
  );
  console.log(`[Admin Publisher] Published Alert for ${location}`);
}
