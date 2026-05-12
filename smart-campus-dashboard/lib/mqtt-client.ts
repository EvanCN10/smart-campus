// File ini mengekspor satu instance MQTT client yang dibuat sekali
// dan dipakai di seluruh aplikasi (tidak membuat koneksi baru tiap render)

import mqtt, { MqttClient } from "mqtt";
import { useDashboardStore } from "@/store/useDashboardStore";
import { parseMqttMessage } from "./topic-parser";

// Config koneksi broker
// Gunakan HiveMQ public broker untuk development
// Ganti dengan HiveMQ Cloud credentials saat production
const BROKER_URL =
  process.env.NEXT_PUBLIC_MQTT_BROKER_URL ??
  "wss://broker.hivemq.com:8884/mqtt";
const CLIENT_ID = `smart-campus-dashboard-${Math.random().toString(16).slice(2, 8)}`;

// Topic yang di-subscribe frontend
const SUBSCRIBE_TOPICS = [
  "campus/#", // Subscribe semua topic di bawah campus/
];

let clientInstance: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  // Kalau client sudah ada dan masih terhubung, return yang existing
  if (clientInstance && clientInstance.connected) {
    return clientInstance;
  }

  const { setConnectionStatus } = useDashboardStore.getState();
  setConnectionStatus("connecting");

  clientInstance = mqtt.connect(BROKER_URL, {
    clientId: CLIENT_ID,
    clean: true, // Setiap connect = sesi baru
    connectTimeout: 10000, // Timeout 10 detik
    reconnectPeriod: 3000, // Coba reconnect tiap 3 detik
    keepalive: 60, // Ping broker tiap 60 detik agar koneksi tidak mati
    protocolVersion: 5, // MQTT v5 (wajib untuk User Properties & Topic Alias)
  });

  // ── Event: Berhasil connect ──────────────────────────────────
  clientInstance.on("connect", () => {
    console.log("[MQTT] Connected to broker:", BROKER_URL);
    setConnectionStatus("connected");

    // Subscribe ke semua topic yang dibutuhkan
    clientInstance!.subscribe(SUBSCRIBE_TOPICS, { qos: 1 }, (err) => {
      if (err) {
        console.error("[MQTT] Subscribe error:", err);
      } else {
        console.log("[MQTT] Subscribed to:", SUBSCRIBE_TOPICS);
      }
    });
  });

  // ── Event: Pesan masuk ───────────────────────────────────────
  // Ini adalah jantung dari frontend realtime
  // Setiap pesan dari broker akan masuk ke sini
  clientInstance.on("message", (topic: string, payload: Buffer, packet: any) => {
    // Delegasikan parsing ke topic-parser.ts
    // Fitur MQTT: Meneruskan packet untuk membaca User Properties (Metadata)
    parseMqttMessage(topic, payload, packet);
  });

  // ── Event: Koneksi terputus ──────────────────────────────────
  clientInstance.on("disconnect", () => {
    console.log("[MQTT] Disconnected");
    setConnectionStatus("disconnected");
  });

  // ── Event: Error koneksi ─────────────────────────────────────
  clientInstance.on("error", (err) => {
    console.error("[MQTT] Connection error:", err);
    setConnectionStatus("error");
  });

  // ── Event: Sedang reconnect ──────────────────────────────────
  clientInstance.on("reconnect", () => {
    console.log("[MQTT] Reconnecting...");
    setConnectionStatus("connecting");
  });

  // ── Event: Koneksi offline ───────────────────────────────────
  clientInstance.on("offline", () => {
    console.log("[MQTT] Client offline");
    setConnectionStatus("disconnected");
  });

  return clientInstance;
}

// Fitur Dashboard: Publish command dari dashboard ke backend via MQTT
// Ini memungkinkan kontrol interaktif dari dashboard
export function publishFromDashboard(topic: string, payload: string, qos: 0 | 1 | 2 = 1): void {
  if (clientInstance && clientInstance.connected) {
    clientInstance.publish(topic, payload, { qos });
    console.log(`[MQTT] Published to ${topic}:`, payload);
  } else {
    console.warn("[MQTT] Cannot publish - client not connected");
  }
}

export function disconnectMqtt(): void {
  if (clientInstance) {
    clientInstance.end();
    clientInstance = null;
  }
}

export function reconnectMqtt(): void {
  disconnectMqtt();
  getMqttClient();
}
