// MQTT Payload Types

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
