import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import {
  EnvironmentData,
  OccupancyData,
  AlertData,
  SystemStatusData,
  AnnouncementData,
} from "./types";

dotenv.config();

// Backend menggunakan protokol mqtt:// (TCP) standar, bukan wss:// (WebSocket) seperti frontend
const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`Menghubungkan ke broker MQTT: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl);

const rooms = [
  { id: "room-a", name: "Lab A", capacity: 50 },
  { id: "room-b", name: "Ruang Kelas B", capacity: 40 },
  { id: "room-c", name: "Perpustakaan", capacity: 100 },
];

client.on("connect", () => {
  console.log("Terhubung ke MQTT broker!");

  // Kirim status sistem saat terhubung
  publishSystemStatus("sensor-gateway", "online");

  // Jalankan simulasi sensor
  startSimulation();
});

client.on("error", (err) => {
  console.error("MQTT Error:", err);
});

function publishEnvironment(roomId: string, roomName: string) {
  // Simulasi suhu (20-30 C)
  const temp: EnvironmentData = {
    value: parseFloat((20 + Math.random() * 10).toFixed(1)),
    unit: "C",
    roomId,
    roomName,
    timestamp: new Date().toISOString(),
  };
  client.publish(`campus/environment/${roomId}/temperature`, JSON.stringify(temp));

  // Simulasi kelembapan (40-60 %)
  const humidity: EnvironmentData = {
    value: parseFloat((40 + Math.random() * 20).toFixed(1)),
    unit: "%",
    roomId,
    roomName,
    timestamp: new Date().toISOString(),
  };
  client.publish(`campus/environment/${roomId}/humidity`, JSON.stringify(humidity));
  
  // Simulasi kualitas udara (AQI 0-100)
  const airQuality: EnvironmentData = {
    value: Math.floor(Math.random() * 100),
    unit: "AQI",
    roomId,
    roomName,
    timestamp: new Date().toISOString(),
  };
  client.publish(`campus/environment/${roomId}/air-quality`, JSON.stringify(airQuality));
  
  console.log(`[Environment] Published data for ${roomName}`);
}

function publishOccupancy(roomId: string, roomName: string, capacity: number) {
  const count = Math.floor(Math.random() * (capacity + 1));
  const percentage = Math.round((count / capacity) * 100);

  const data: OccupancyData = {
    count,
    capacity,
    percentage,
    roomId,
    roomName,
    timestamp: new Date().toISOString(),
  };

  client.publish(`campus/occupancy/${roomId}/count`, JSON.stringify(data));
  console.log(`[Occupancy] Published data for ${roomName}: ${count}/${capacity}`);
  
  // Trigger alert if occupancy is almost full
  if (percentage >= 90) {
    publishAlert("warning", roomName, `Ruangan ${roomName} hampir penuh (${percentage}%)`);
  }
}

function publishAlert(severity: "critical" | "warning" | "info", location: string, message: string) {
  const data: AlertData = {
    id: `alert-${Date.now()}`,
    severity,
    location,
    message,
    timestamp: new Date().toISOString(),
  };

  client.publish(`campus/alerts/${severity}/${location.toLowerCase().replace(/\s+/g, '-')}`, JSON.stringify(data));
  console.log(`[Alert] Published ${severity} alert for ${location}`);
}

function publishSystemStatus(service: string, status: "online" | "offline") {
  const data: SystemStatusData = {
    service,
    status,
    timestamp: new Date().toISOString(),
  };
  client.publish(`campus/system/${service}/status`, JSON.stringify(data));
}

function publishAnnouncement(title: string, message: string) {
  const data: AnnouncementData = {
    title,
    message,
    timestamp: new Date().toISOString(),
  };
  client.publish(`campus/announcements/broadcast`, JSON.stringify(data));
  console.log(`[Announcement] Published: ${title}`);
}

function startSimulation() {
  console.log("Memulai simulasi sensor...");

  // Update lingkungan setiap 5 detik
  setInterval(() => {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    publishEnvironment(room.id, room.name);
  }, 5000);

  // Update okupansi setiap 8 detik
  setInterval(() => {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    publishOccupancy(room.id, room.name, room.capacity);
  }, 8000);

  // Kirim pengumuman setiap 30 detik
  setInterval(() => {
    publishAnnouncement(
      "Informasi Kampus",
      "Perawatan rutin jaringan kampus akan dilakukan pada pukul 23:00 WIB."
    );
  }, 30000);
}
