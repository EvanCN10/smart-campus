// MQTT Payload Types
// Setiap publisher mengirim JSON dengan struktur ini

export interface EnvironmentData {
  value: number;
  unit: string;
  roomId: string;
  roomName: string;
  timestamp: string;
}

export interface OccupancyData {
  count: number;
  capacity: number;
  percentage: number;
  roomId: string;
  roomName: string;
  timestamp: string;
}

export interface AlertData {
  id: string;
  severity: "critical" | "warning" | "info";
  location: string;
  message: string;
  timestamp: string;
}

export interface SystemStatusData {
  service: string;
  status: "online" | "offline";
  timestamp: string;
}

export interface AnnouncementData {
  title: string;
  message: string;
  timestamp: string;
}

// Request-Response (MQTT v5)

export interface RoomSnapshotRequest {
  requestId: string;
  roomId: string | "all";
  responseTopic: string;
  timestamp: string;
}

export interface RoomSnapshotResponse {
  requestId: string;
  roomId: string | "all";
  environments: Record<string, RoomEnvironment>;
  occupancies: Record<string, RoomOccupancy>;
  timestamp: string;
}

export type RoomSnapshotStatus = "idle" | "pending" | "success" | "error";

export interface RoomSnapshotState {
  status: RoomSnapshotStatus;
  lastRequestId: string | null;
  lastRoomId: string | "all" | null;
  requestedAt: string | null;
  receivedAt: string | null;
  lastResponse: RoomSnapshotResponse | null;
  error: string | null;
}

// Store State Types

export interface RoomEnvironment {
  roomId: string;
  roomName: string;
  temperature: number | null;
  humidity: number | null;
  airQuality: number | null;
  lastUpdated: string | null;
}

export interface RoomOccupancy {
  roomId: string;
  roomName: string;
  count: number;
  capacity: number;
  percentage: number;
  lastUpdated: string | null;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export type MqttConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Dashboard Store Type

export interface DashboardState {
  // Connection
  connectionStatus: MqttConnectionStatus;

  // Environment data: key = roomId
  environments: Record<string, RoomEnvironment>;

  // Occupancy data: key = roomId
  occupancies: Record<string, RoomOccupancy>;

  // Chart history: key = "roomId-metric" (misal: "room-a-temperature")
  chartHistory: Record<string, ChartDataPoint[]>;

  // Alerts (max 50 terbaru)
  alerts: AlertData[];

  // System service status
  systemStatus: Record<string, "online" | "offline">;

  // Announcements
  latestAnnouncement: AnnouncementData | null;

  // Request-Response snapshot
  roomSnapshot: RoomSnapshotState;

  // Actions
  setConnectionStatus: (status: MqttConnectionStatus) => void;
  updateEnvironment: (
    roomId: string,
    metric: "temperature" | "humidity" | "airQuality",
    data: EnvironmentData,
  ) => void;
  updateOccupancy: (roomId: string, data: OccupancyData) => void;
  addAlert: (alert: AlertData) => void;
  clearAlerts: () => void;
  updateSystemStatus: (service: string, status: "online" | "offline") => void;
  setAnnouncement: (data: AnnouncementData) => void;

  // Request-Response actions
  setRoomSnapshotPending: (requestId: string, roomId: string | "all") => void;
  setRoomSnapshotSuccess: (response: RoomSnapshotResponse) => void;
  setRoomSnapshotError: (error: string) => void;
  clearRoomSnapshot: () => void;
}
