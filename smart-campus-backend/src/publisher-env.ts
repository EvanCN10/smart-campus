import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { EnvironmentData, SystemStatusData } from "./types";

dotenv.config();

const brokerUrl =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Env Publisher] Menghubungkan ke ${brokerUrl}...`);

// Fitur MQTT: Last Will and Testament (LWT)
// Jika publisher ini mati tiba-tiba, broker akan otomatis mengirim status offline
const willPayload: SystemStatusData = {
  service: "sensor-environment",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_env_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5,
  // Flow control sederhana: jangan antri QoS0 saat offline
  queueQoSZero: false,
  // Rubric: Topic Alias (negosiasi)
  properties: {
    topicAliasMaximum: 10,
  },
  will: {
    topic: "campus/system/sensor-environment/status",
    payload: JSON.stringify(willPayload),
    qos: 1,
    retain: true, // Fitur MQTT: Retain message
  },
});

const rooms = [
  { id: "room-a", name: "Lab A" },
  { id: "room-b", name: "Ruang Kelas B" },
  { id: "room-c", name: "Perpustakaan" },
];

client.on("connect", () => {
  console.log("[Env Publisher] Terhubung!");

  // Kirim status online (Retained)
  const onlinePayload: SystemStatusData = {
    service: "sensor-environment",
    status: "online",
    timestamp: new Date().toISOString(),
  };
  client.publish(
    "campus/system/sensor-environment/status",
    JSON.stringify(onlinePayload),
    {
      qos: 1,
      retain: true,
      // Rubric: Topic Alias + User Properties
      properties: {
        topicAlias: 1,
        userProperties: {
          source: "publisher-env",
          service: "sensor-environment",
          kind: "system-status",
        },
      },
    },
  );

  setInterval(publishData, 5000);
});

function publishData() {
  if (!client.connected) return;
  const room = rooms[Math.floor(Math.random() * rooms.length)];

  const temp: EnvironmentData = {
    value: parseFloat((20 + Math.random() * 10).toFixed(1)),
    unit: "C",
    roomId: room.id,
    roomName: room.name,
    timestamp: new Date().toISOString(),
  };

  const humidity: EnvironmentData = {
    value: parseFloat((40 + Math.random() * 20).toFixed(1)),
    unit: "%",
    roomId: room.id,
    roomName: room.name,
    timestamp: new Date().toISOString(),
  };

  const airQuality: EnvironmentData = {
    value: Math.floor(Math.random() * 120),
    unit: "AQI",
    roomId: room.id,
    roomName: room.name,
    timestamp: new Date().toISOString(),
  };

  // Fitur MQTT: Publish dengan QoS 0 dan Retain True
  // Retain memastikan subscriber baru langsung mendapat data suhu/kelembapan terakhir
  client.publish(
    `campus/environment/${room.id}/temperature`,
    JSON.stringify(temp),
    {
      qos: 0,
      retain: true,
      // Rubric: User Properties (Metadata)
      properties: {
        userProperties: {
          source: "publisher-env",
          roomId: room.id,
          metric: "temperature",
        },
      },
    },
  );
  client.publish(
    `campus/environment/${room.id}/humidity`,
    JSON.stringify(humidity),
    {
      qos: 0,
      retain: true,
      properties: {
        userProperties: {
          source: "publisher-env",
          roomId: room.id,
          metric: "humidity",
        },
      },
    },
  );

  client.publish(
    `campus/environment/${room.id}/air-quality`,
    JSON.stringify(airQuality),
    {
      qos: 0,
      retain: true,
      properties: {
        userProperties: {
          source: "publisher-env",
          roomId: room.id,
          metric: "air-quality",
        },
      },
    },
  );

  console.log(`[Env Publisher] Published Suhu & Kelembapan untuk ${room.name}`);
}
