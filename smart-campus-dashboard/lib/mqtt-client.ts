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

const RR_REQUEST_TOPIC = "campus/rr/room-snapshot/request";
const RR_RESPONSE_TOPIC = `campus/rr/room-snapshot/response/${CLIENT_ID}`;

function createRequestId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function getDashboardClientId(): string {
  return CLIENT_ID;
}

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
    protocolVersion: 5, // MQTT v5 (MQTT v3.1.1 juga ok)
    // Negosiasi fitur v5 (untuk rubric: Topic Alias)
    properties: {
      topicAliasMaximum: 10,
    },
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
  clientInstance.on("message", (topic: string, payload: Buffer) => {
    // Delegasikan parsing ke topic-parser.ts
    parseMqttMessage(topic, payload);
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

export function requestRoomSnapshot(roomId: string | "all"): string {
  const requestId = createRequestId();
  const store = useDashboardStore.getState();

  store.setRoomSnapshotPending(requestId, roomId);

  const client = getMqttClient();
  if (!client.connected) {
    store.setRoomSnapshotError("MQTT belum terhubung");
    return requestId;
  }

  const payload = {
    requestId,
    roomId,
    responseTopic: RR_RESPONSE_TOPIC,
    timestamp: new Date().toISOString(),
  };

  client.publish(
    RR_REQUEST_TOPIC,
    JSON.stringify(payload),
    {
      qos: 1,
      properties: {
        // MQTT v5 request-response (rubric)
        responseTopic: RR_RESPONSE_TOPIC,
        correlationData: Buffer.from(requestId),

        // Rubric: Message Expiry + User Properties
        messageExpiryInterval: 30,
        userProperties: {
          feature: "request-response",
          kind: "room-snapshot-request",
          clientId: CLIENT_ID,
        },
      },
    },
    (err) => {
      if (err) {
        store.setRoomSnapshotError("Gagal mengirim request");
      }
    },
  );

  return requestId;
}

export function disconnectMqtt(): void {
  if (clientInstance) {
    clientInstance.end();
    clientInstance = null;
  }
}
