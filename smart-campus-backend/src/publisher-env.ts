import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { EnvironmentData, SystemStatusData } from "./types";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Env Publisher] Menghubungkan ke ${brokerUrl}...`);

// Fitur MQTT (Rubrik 7): Last Will and Testament (LWT) untuk auto-offline status
const willPayload: SystemStatusData = {
  service: "sensor-environment",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_env_${Math.random().toString(16).slice(3)}`,
  protocolVersion: 5, // Pastikan menggunakan MQTT v5 untuk mendukung properties
  will: {
    topic: "campus/system/sensor-environment/status",
    payload: JSON.stringify(willPayload),
    qos: 1,
    retain: true, // Fitur MQTT (Rubrik 3): Retain message agar status "offline" tersimpan di broker
  },
});

const rooms = [
  { id: "room-a", name: "Lab A" },
  { id: "room-b", name: "Ruang Kelas B" },
  { id: "room-c", name: "Perpustakaan" },
];

client.on("connect", () => {
  console.log("[Env Publisher] Terhubung!");

  // Fitur MQTT (Rubrik 3): Kirim status online (Retained message)
  const onlinePayload: SystemStatusData = {
    service: "sensor-environment",
    status: "online",
    timestamp: new Date().toISOString(),
  };
  client.publish("campus/system/sensor-environment/status", JSON.stringify(onlinePayload), {
    qos: 1,
    retain: true,
  });

  // Fitur MQTT (Rubrik 8): Request-Response Pattern (Responder: Subscribe ke request topic)
  client.subscribe("campus/system/request/health");

  setInterval(publishData, 5000);
});

client.on("message", (topic, message, packet) => {
  if (topic === "campus/system/request/health") {
    console.log("\n[Env Publisher] Menerima request health check");
    
    // Fitur MQTT (Rubrik 8): Request-Response Pattern (Membaca responseTopic & correlationData dari request)
    const responseTopic = packet.properties?.responseTopic;
    const correlationData = packet.properties?.correlationData;
    
    if (responseTopic && correlationData) {
      const responsePayload = JSON.stringify({
        status: "ok",
        service: "sensor-environment",
        uptime: process.uptime()
      });
      
      // Mengirim balasan ke responseTopic yang diminta
      client.publish(responseTopic, responsePayload, {
        qos: 1,
        properties: {
          correlationData: correlationData // Mengembalikan correlationData yang sama
        }
      });
      console.log(`[Env Publisher] Membalas ke ${responseTopic} dengan correlationData`);
    }
  }
});

function publishData() {
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

  // Fitur MQTT (Rubrik 3): Publish QoS 0 dengan Retain True (Agar subscriber baru langsung dapat data terakhir)
  
  // Fitur MQTT (Rubrik 4, 5, 6): Message Expiry, User Properties & Topic Alias
  const commonProperties = {
    messageExpiryInterval: 60, // (Rubrik 4) Pesan otomatis dihapus broker dalam 60 detik jika belum diterima
    userProperties: { // (Rubrik 5) Metadata tambahan tanpa merubah struktur payload JSON utama
      'sensor-type': 'DHT22',
      'location-building': 'Gedung Utama',
    }
  };

  client.publish(`campus/environment/${room.id}/temperature`, JSON.stringify(temp), { 
    qos: 0, 
    retain: true,
    properties: {
      ...commonProperties,
      topicAlias: 1 // Fitur MQTT (Rubrik 6): Topic Alias untuk mengoptimalkan panjang payload string topic
    }
  });
  
  client.publish(`campus/environment/${room.id}/humidity`, JSON.stringify(humidity), { 
    qos: 0, 
    retain: true,
    properties: {
      ...commonProperties,
      topicAlias: 2
    }
  });

  console.log(`[Env Publisher] Published Suhu & Kelembapan untuk ${room.name} (dengan Expiry, Metadata, Alias)`);
}
