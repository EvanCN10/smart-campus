"use client";

import { motion } from "framer-motion";
import { Thermometer, Droplets, Wind } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { RoomEnvironment } from "@/lib/types";

interface EnvironmentCardProps {
  room: RoomEnvironment;
  index: number;
}

function getAirQualityLabel(aqi: number | null): string {
  if (aqi === null) return "N/A";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy";
  return "Hazardous";
}

function MetricRow({
  Icon,
  label,
  value,
  unit,
  color,
}: {
  Icon: React.ElementType;
  label: string;
  value: number | null;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-main/50 last:border-0">
      <div className="flex items-center gap-2 text-text-secondary text-sm">
        <Icon size={15} className={color} />
        {label}
      </div>
      <span className="text-text-primary font-semibold font-mono">
        {value !== null ? `${value.toFixed(1)} ${unit}` : "—"}
      </span>
    </div>
  );
}

export function EnvironmentCard({ room, index }: EnvironmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card glowOnHover>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-text-primary font-semibold text-base">
              {room.roomName}
            </h3>
            <p className="text-text-muted text-xs mt-0.5 font-mono">
              {room.roomId}
            </p>
          </div>
          <Badge
            variant={room.lastUpdated ? "success" : "muted"}
            label={room.lastUpdated ? "Live" : "No Data"}
            pulse={!!room.lastUpdated}
          />
        </div>

        {/* Metrics */}
        <div className="mt-2">
          <MetricRow
            Icon={Thermometer}
            label="Temperature"
            value={room.temperature}
            unit="°C"
            color="text-danger"
          />
          <MetricRow
            Icon={Droplets}
            label="Humidity"
            value={room.humidity}
            unit="%"
            color="text-accent"
          />
          <MetricRow
            Icon={Wind}
            label="Air Quality"
            value={room.airQuality}
            unit="AQI"
            color="text-success"
          />
        </div>

        {/* AQI Label */}
        {room.airQuality !== null && (
          <div className="mt-3 pt-3 border-t border-border-main/30">
            <Badge
              variant={
                room.airQuality <= 50
                  ? "success"
                  : room.airQuality <= 100
                    ? "warning"
                    : "danger"
              }
              label={`Air: ${getAirQualityLabel(room.airQuality)}`}
            />
          </div>
        )}

        {/* Last updated */}
        {room.lastUpdated && (
          <p className="text-text-muted text-xs mt-3">
            Updated: {new Date(room.lastUpdated).toLocaleTimeString("id-ID")}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
