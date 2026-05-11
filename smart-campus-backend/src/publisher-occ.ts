import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import { OccupancyData, SystemStatusData } from "./types";

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

console.log(`[Occ Publisher] Menghubungkan ke ${brokerUrl}...`);

const willPayload: SystemStatusData = {
  service: "sensor-occupancy",
  status: "offline",
  timestamp: new Date().toISOString(),
};

const client = mqtt.connect(brokerUrl, {
  clientId: `publisher_occ_${Math.random().toString(16).slice(3)}`,
  will: {
    topic: "campus/system/sensor-occupancy/status",
    payload: JSON.stringify(willPayload),
    qos: 1,
    retain: true,
  },
});

const rooms = [
  { id: "room-a", name: "Lab A", capacity: 50 },
  { id: "room-b", name: "Ruang Kelas B", capacity: 40 },
  { id: "room-c", name: "Perpustakaan", capacity: 100 },
];

client.on("connect", () => {
  console.log("[Occ Publisher] Terhubung!");

  const onlinePayload: SystemStatusData = {
    service: "sensor-occupancy",
    status: "online",
    timestamp: new Date().toISOString(),
  };
  client.publish("campus/system/sensor-occupancy/status", JSON.stringify(onlinePayload), { qos: 1, retain: true });

  setInterval(publishData, 7000);
});

function publishData() {
  const room = rooms[Math.floor(Math.random() * rooms.length)];
  const count = Math.floor(Math.random() * (room.capacity + 1));
  const percentage = Math.round((count / room.capacity) * 100);

  const data: OccupancyData = {
    count,
    capacity: room.capacity,
    percentage,
    roomId: room.id,
    roomName: room.name,
    timestamp: new Date().toISOString(),
  };

  // Fitur MQTT: Publish dengan QoS 1 (At least once)
  client.publish(`campus/occupancy/${room.id}/count`, JSON.stringify(data), { qos: 1, retain: true });

  console.log(`[Occ Publisher] Published Okupansi ${room.name}: ${count}/${room.capacity} (${percentage}%)`);
}
