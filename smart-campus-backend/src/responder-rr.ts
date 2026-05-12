import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import type { EnvironmentData, OccupancyData } from "./types";

dotenv.config();

const brokerUrl =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

const CLIENT_ID = `responder_rr_${Math.random().toString(16).slice(3)}`;

const RR_REQUEST_TOPIC = "campus/rr/room-snapshot/request";

type RoomEnvironmentAgg = {
  roomId: string;
  roomName: string;
  temperature: number | null;
  humidity: number | null;
  airQuality: number | null;
  lastUpdated: string | null;
};

type RoomOccupancyAgg = {
  roomId: string;
  roomName: string;
  count: number;
  capacity: number;
  percentage: number;
  lastUpdated: string | null;
};

const environments: Record<string, RoomEnvironmentAgg> = {};
const occupancies: Record<string, RoomOccupancyAgg> = {};

function ensureEnv(roomId: string, roomName: string): RoomEnvironmentAgg {
  environments[roomId] ??= {
    roomId,
    roomName,
    temperature: null,
    humidity: null,
    airQuality: null,
    lastUpdated: null,
  };
  environments[roomId].roomName = roomName;
  return environments[roomId];
}

function setEnvMetric(
  roomId: string,
  metric: "temperature" | "humidity" | "airQuality",
  data: EnvironmentData,
) {
  const env = ensureEnv(roomId, data.roomName);
  env[metric] = data.value;
  env.lastUpdated = data.timestamp;
}

function setOccupancy(roomId: string, data: OccupancyData) {
  occupancies[roomId] = {
    roomId,
    roomName: data.roomName,
    count: data.count,
    capacity: data.capacity,
    percentage: data.percentage,
    lastUpdated: data.timestamp,
  };
}

console.log(`[RR Responder] Menghubungkan ke ${brokerUrl}...`);

const client = mqtt.connect(brokerUrl, {
  clientId: CLIENT_ID,
  protocolVersion: 5,
  clean: true,
  reconnectPeriod: 3000,
  // Rubric: Topic Alias (negosiasi maksimum alias)
  properties: {
    topicAliasMaximum: 10,
  },
});

client.on("connect", () => {
  console.log("[RR Responder] Terhubung!");

  client.subscribe(
    ["campus/environment/#", "campus/occupancy/#", RR_REQUEST_TOPIC],
    { qos: 1 },
    (err) => {
      if (err) {
        console.error("[RR Responder] Subscribe error:", err);
      } else {
        console.log("[RR Responder] Subscribed to env/occ + request topic");
      }
    },
  );
});

client.on("message", (topic, payload, packet) => {
  // Cache latest env/occ untuk dipakai snapshot
  if (topic.startsWith("campus/environment/")) {
    const seg = topic.split("/");
    if (seg.length === 4) {
      const roomId = seg[2];
      const metric = seg[3];
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload.toString());
      } catch {
        return;
      }

      const data = parsed as EnvironmentData;
      if (metric === "temperature") setEnvMetric(roomId, "temperature", data);
      if (metric === "humidity") setEnvMetric(roomId, "humidity", data);
      if (metric === "air-quality") setEnvMetric(roomId, "airQuality", data);
    }
    return;
  }

  if (topic.startsWith("campus/occupancy/")) {
    const seg = topic.split("/");
    if (seg.length === 4 && seg[3] === "count") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload.toString());
      } catch {
        return;
      }
      const data = parsed as OccupancyData;
      setOccupancy(seg[2], data);
    }
    return;
  }

  // Request–Response handler
  if (topic === RR_REQUEST_TOPIC) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString());
    } catch {
      return;
    }

    const req = parsed as {
      requestId?: string;
      roomId?: string | "all";
      responseTopic?: string;
      timestamp?: string;
    };

    const requestId = req.requestId;
    const roomId = req.roomId ?? "all";

    // Bisa ambil responseTopic dari MQTT v5 properties atau dari payload
    const responseTopic =
      (packet?.properties as any)?.responseTopic || req.responseTopic;

    if (!requestId || !responseTopic) {
      return;
    }

    const envOut: Record<string, RoomEnvironmentAgg> = {};
    const occOut: Record<string, RoomOccupancyAgg> = {};

    if (roomId === "all") {
      for (const [id, env] of Object.entries(environments)) envOut[id] = env;
      for (const [id, occ] of Object.entries(occupancies)) occOut[id] = occ;
    } else {
      if (environments[roomId]) envOut[roomId] = environments[roomId];
      if (occupancies[roomId]) occOut[roomId] = occupancies[roomId];
    }

    const res = {
      requestId,
      roomId,
      environments: envOut,
      occupancies: occOut,
      timestamp: new Date().toISOString(),
    };

    client.publish(responseTopic, JSON.stringify(res), {
      qos: 1,
      // Rubric: Message Expiry + User Properties
      properties: {
        messageExpiryInterval: 30,
        correlationData: Buffer.from(requestId),
        userProperties: {
          feature: "request-response",
          kind: "room-snapshot-response",
          responder: CLIENT_ID,
        },
      },
    });

    return;
  }
});

client.on("error", (err) => {
  console.error("[RR Responder] Error:", err);
});
