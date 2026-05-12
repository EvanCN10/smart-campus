"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Navbar } from "@/components/dashboard/Navbar";
import { EnvironmentCard } from "@/components/dashboard/EnvironmentCard";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { TemperatureChart } from "@/components/charts/TemperatureChart";
import { requestRoomSnapshot } from "@/lib/mqtt-client";

function StatPill({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-accent/20 text-accent border-accent/30"
          : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-bg-secondary text-text-muted border-border-main"
      }
    >
      {children}
    </span>
  );
}

export default function DashboardPage() {
  type SummaryModalKey =
    | "Rooms Monitored"
    | "Active Alerts"
    | "Critical Alerts"
    | "Avg Temperature";
  type RoomFilter = "all" | "room-a" | "room-b" | "room-c";

  const environments = useDashboardStore((s) => s.environments);
  const occupancies = useDashboardStore((s) => s.occupancies);
  const alerts = useDashboardStore((s) => s.alerts);
  const connectionStatus = useDashboardStore((s) => s.connectionStatus);
  const roomSnapshot = useDashboardStore((s) => s.roomSnapshot);

  const [activeModal, setActiveModal] = useState<SummaryModalKey | null>(null);
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("all");

  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    if (!activeModal) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeModal]);

  const envList = Object.values(environments);
  const occList = Object.values(occupancies);
  const critical = alerts.filter((a) => a.severity === "critical").length;

  // Hitung rata-rata suhu semua ruangan
  const avgTemp =
    envList.length > 0
      ? (
          envList.reduce((sum, r) => sum + (r.temperature ?? 0), 0) /
          envList.length
        ).toFixed(1)
      : null;

  const summaryStats = [
    {
      label: "Rooms Monitored",
      value: envList.length,
      color: "text-accent",
    },
    {
      label: "Active Alerts",
      value: alerts.length,
      color: alerts.length > 0 ? "text-warning" : "text-success",
    },
    {
      label: "Critical Alerts",
      value: critical,
      color: critical > 0 ? "text-danger" : "text-success",
    },
    {
      label: "Avg Temperature",
      value: avgTemp ? `${avgTemp}°C` : "—",
      color: "text-text-primary",
    },
  ] as const;

  const roomFilterOptions = useMemo(
    () => [
      { id: "all" as const, label: "All" },
      { id: "room-a" as const, label: "Lab A" },
      { id: "room-c" as const, label: "Perpustakaan" },
      { id: "room-b" as const, label: "Ruang Kelas B" },
    ],
    [],
  );

  const roomsToShow = useMemo(() => {
    if (roomFilter !== "all") return [roomFilter];

    const ids = new Set<string>();
    for (const r of envList) ids.add(r.roomId);
    for (const r of occList) ids.add(r.roomId);

    // Biar urut konsisten sesuai opsi filter yang diminta
    const preferred = ["room-a", "room-c", "room-b"];
    const rest = [...ids].filter((id) => !preferred.includes(id)).sort();

    return [...preferred.filter((id) => ids.has(id)), ...rest];
  }, [envList, occList, roomFilter]);

  const modalTitle = useMemo(() => {
    if (!activeModal) return "";
    if (activeModal === "Rooms Monitored") return "Room Monitoring";
    return activeModal;
  }, [activeModal]);

  const severityStyles = {
    critical: {
      label: "CRITICAL",
      color: "text-danger",
      bg: "bg-danger/10",
      border: "border-danger/30",
    },
    warning: {
      label: "WARNING",
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/30",
    },
    info: {
      label: "INFO",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/30",
    },
  } as const;

  const filteredAlerts = useMemo(() => {
    if (!activeModal) return [];
    if (activeModal === "Critical Alerts")
      return alerts.filter((a) => a.severity === "critical");
    if (activeModal === "Active Alerts") return alerts;
    return [];
  }, [activeModal, alerts]);

  function formatTime(ts: string | null | undefined) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-20 px-4 sm:px-6 pb-12 max-w-[1600px] mx-auto">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="py-6">
          <h1 className="text-xl font-bold text-text-primary">
            Campus Overview
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Real-time monitoring via MQTT microservices
          </p>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            {summaryStats.map((stat, i) => (
              <motion.button
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                type="button"
                onClick={() => {
                  setActiveModal(stat.label);
                  if (stat.label === "Rooms Monitored") setRoomFilter("all");
                }}
                aria-haspopup="dialog"
                className="bg-surface border border-border-main rounded-xl p-4 text-left transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
              >
                <p className="text-text-muted text-xs">{stat.label}</p>
                <p
                  className={`text-2xl font-bold font-mono mt-1 ${stat.color}`}
                >
                  {stat.value}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Summary modal (popup) ───────────────────────── */}
        {activeModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={closeModal}
              className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-4xl">
              <div className="bg-surface border border-border-main rounded-2xl p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-text-primary font-semibold text-base sm:text-lg truncate">
                      {modalTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatPill active={connectionStatus === "connected"}>
                        MQTT: {connectionStatus}
                      </StatPill>
                      <StatPill active={alerts.length > 0}>
                        Alerts: {alerts.length}
                      </StatPill>
                      <StatPill active={critical > 0}>
                        Critical: {critical}
                      </StatPill>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border-main bg-bg-secondary hover:bg-surface-hover transition-colors"
                    aria-label="Close popup"
                  >
                    <X size={16} className="text-text-secondary" />
                  </button>
                </div>

                {activeModal === "Rooms Monitored" && (
                  <div>
                    <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-text-primary font-semibold text-sm">
                            Request–Response: Room Snapshot
                          </p>
                          <p className="text-text-muted text-xs mt-0.5">
                            Ambil snapshot terbaru dari backend (bukan
                            streaming).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const target =
                              roomFilter === "all" ? "all" : roomFilter;
                            requestRoomSnapshot(target);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold border bg-surface hover:bg-surface-hover border-border-main text-text-primary transition-colors"
                        >
                          Request Snapshot
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatPill active={roomSnapshot.status === "success"}>
                          Status: {roomSnapshot.status}
                        </StatPill>
                        {roomSnapshot.lastRoomId && (
                          <StatPill active>
                            Room: {roomSnapshot.lastRoomId}
                          </StatPill>
                        )}
                        {roomSnapshot.requestedAt && (
                          <StatPill active={false}>
                            Requested: {formatTime(roomSnapshot.requestedAt)}
                          </StatPill>
                        )}
                        {roomSnapshot.receivedAt && (
                          <StatPill active={false}>
                            Received: {formatTime(roomSnapshot.receivedAt)}
                          </StatPill>
                        )}
                      </div>

                      {roomSnapshot.status === "error" &&
                        roomSnapshot.error && (
                          <p className="text-danger text-xs mt-2">
                            {roomSnapshot.error}
                          </p>
                        )}

                      {roomSnapshot.status === "success" &&
                        roomSnapshot.lastResponse && (
                          <p className="text-text-muted text-xs mt-2">
                            Environments:{" "}
                            {
                              Object.keys(
                                roomSnapshot.lastResponse.environments,
                              ).length
                            }{" "}
                            · Occupancies:{" "}
                            {
                              Object.keys(roomSnapshot.lastResponse.occupancies)
                                .length
                            }
                          </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <p className="text-text-muted text-xs mr-1">
                        Filter room:
                      </p>
                      {roomFilterOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRoomFilter(opt.id)}
                          className={
                            roomFilter === opt.id
                              ? "px-3 py-1.5 rounded-full text-xs font-medium border bg-accent/20 text-accent border-accent/30"
                              : "px-3 py-1.5 rounded-full text-xs font-medium border bg-bg-secondary text-text-muted border-border-main hover:bg-surface-hover"
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {roomsToShow.length === 0 ? (
                      <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 text-center text-text-muted text-sm">
                        Belum ada data ruangan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {roomsToShow.map((roomId) => {
                          const env = environments[roomId];
                          const occ = occupancies[roomId];

                          const roomName =
                            env?.roomName ?? occ?.roomName ?? roomId;

                          return (
                            <div
                              key={roomId}
                              className="bg-bg-secondary border border-border-main rounded-2xl p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-text-primary font-semibold text-sm truncate">
                                    {roomName}
                                  </p>
                                  <p className="text-text-muted text-xs font-mono">
                                    {roomId}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-text-muted text-[11px]">
                                    Last update
                                  </p>
                                  <p className="text-text-secondary text-xs font-mono">
                                    {formatTime(
                                      env?.lastUpdated ?? occ?.lastUpdated,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                <div className="rounded-xl border border-border-main bg-surface/40 p-3">
                                  <p className="text-text-muted text-xs">
                                    Temperature
                                  </p>
                                  <p className="text-text-primary font-mono text-lg mt-1">
                                    {env?.temperature ?? "—"}
                                    {env?.temperature != null ? "°C" : ""}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-border-main bg-surface/40 p-3">
                                  <p className="text-text-muted text-xs">
                                    Humidity
                                  </p>
                                  <p className="text-text-primary font-mono text-lg mt-1">
                                    {env?.humidity ?? "—"}
                                    {env?.humidity != null ? "%" : ""}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-border-main bg-surface/40 p-3">
                                  <p className="text-text-muted text-xs">
                                    Air Quality
                                  </p>
                                  <p className="text-text-primary font-mono text-lg mt-1">
                                    {env?.airQuality ?? "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 rounded-xl border border-border-main bg-surface/40 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-text-muted text-xs">
                                      Occupancy
                                    </p>
                                    <p className="text-text-primary font-mono text-xl mt-1">
                                      {occ
                                        ? `${occ.count}/${occ.capacity}`
                                        : "—"}
                                    </p>
                                  </div>
                                  {occ ? (
                                    <span
                                      className={
                                        occ.percentage >= 90
                                          ? "px-2.5 py-1 rounded-full text-xs font-medium border bg-danger/20 text-danger border-danger/30"
                                          : occ.percentage >= 70
                                            ? "px-2.5 py-1 rounded-full text-xs font-medium border bg-warning/20 text-warning border-warning/30"
                                            : "px-2.5 py-1 rounded-full text-xs font-medium border bg-success/20 text-success border-success/30"
                                      }
                                    >
                                      {occ.percentage}%
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-bg-secondary text-text-muted border-border-main">
                                      —
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeModal === "Active Alerts" && (
                  <div>
                    {alerts.length === 0 ? (
                      <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 text-center text-text-muted text-sm">
                        Tidak ada alert saat ini.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredAlerts.map((alert) => {
                          const s = severityStyles[alert.severity];
                          return (
                            <div
                              key={alert.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-bold ${s.color}`}
                                  >
                                    {s.label}
                                  </span>
                                  <span className="text-text-muted text-xs">
                                    ·
                                  </span>
                                  <span className="text-text-muted text-xs font-mono">
                                    {alert.location}
                                  </span>
                                  <span className="text-text-muted text-xs">
                                    ·
                                  </span>
                                  <span className="text-text-muted text-xs font-mono">
                                    {formatTime(alert.timestamp)}
                                  </span>
                                </div>
                                <p className="text-text-secondary text-sm leading-snug break-words">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeModal === "Critical Alerts" && (
                  <div>
                    {filteredAlerts.length === 0 ? (
                      <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 text-center text-text-muted text-sm">
                        Tidak ada critical alert.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredAlerts.map((alert) => {
                          const s = severityStyles.critical;
                          return (
                            <div
                              key={alert.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-bold ${s.color}`}
                                  >
                                    {s.label}
                                  </span>
                                  <span className="text-text-muted text-xs">
                                    ·
                                  </span>
                                  <span className="text-text-muted text-xs font-mono">
                                    {alert.location}
                                  </span>
                                  <span className="text-text-muted text-xs">
                                    ·
                                  </span>
                                  <span className="text-text-muted text-xs font-mono">
                                    {formatTime(alert.timestamp)}
                                  </span>
                                </div>
                                <p className="text-text-secondary text-sm leading-snug break-words">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeModal === "Avg Temperature" && (
                  <div>
                    <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 mb-4">
                      <p className="text-text-muted text-xs">
                        Average temperature (all rooms)
                      </p>
                      <p className="text-text-primary font-mono text-3xl mt-2">
                        {avgTemp ? `${avgTemp}°C` : "—"}
                      </p>
                      <p className="text-text-muted text-xs mt-2">
                        Detail per-room di bawah (klik Room Monitoring untuk
                        filter).
                      </p>
                    </div>

                    {envList.length === 0 ? (
                      <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 text-center text-text-muted text-sm">
                        Belum ada data temperature.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {envList
                          .slice()
                          .sort((a, b) => a.roomName.localeCompare(b.roomName))
                          .map((room) => (
                            <div
                              key={room.roomId}
                              className="bg-bg-secondary border border-border-main rounded-2xl p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-text-primary font-semibold text-sm truncate">
                                    {room.roomName}
                                  </p>
                                  <p className="text-text-muted text-xs font-mono">
                                    {room.roomId}
                                  </p>
                                </div>
                                <p className="text-text-muted text-xs font-mono">
                                  {formatTime(room.lastUpdated)}
                                </p>
                              </div>
                              <div className="mt-4 rounded-xl border border-border-main bg-surface/40 p-3">
                                <p className="text-text-muted text-xs">
                                  Temperature
                                </p>
                                <p className="text-text-primary font-mono text-2xl mt-1">
                                  {room.temperature ?? "—"}
                                  {room.temperature != null ? "°C" : ""}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Temperature chart ────────────────────────────── */}
        <section className="mb-8">
          <TemperatureChart />
        </section>

        {/* ── Environment + Alert ──────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Environment cards (kiri, 2/3 lebar) */}
          <div className="xl:col-span-2">
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
              <span className="w-1 h-4 bg-accent rounded-full" />
              Environment Sensors
            </h2>

            {envList.length === 0 ? (
              <div className="bg-surface border border-border-main rounded-2xl p-12 text-center text-text-muted text-sm">
                <p>Waiting for sensor data...</p>
                <p className="text-xs mt-1 opacity-60">
                  Make sure backend publishers are running
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envList.map((room, i) => (
                  <EnvironmentCard key={room.roomId} room={room} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Alert panel (kanan, 1/3 lebar) */}
          <div>
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
              <span className="w-1 h-4 bg-danger rounded-full" />
              Alert Center
            </h2>
            <AlertPanel />
          </div>
        </div>

        {/* ── Occupancy ────────────────────────────────────── */}
        <section>
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 text-sm">
            <span className="w-1 h-4 bg-success rounded-full" />
            Room Occupancy
          </h2>

          {occList.length === 0 ? (
            <div className="bg-surface border border-border-main rounded-2xl p-12 text-center text-text-muted text-sm">
              <p>Waiting for occupancy data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {occList.map((room, i) => (
                <OccupancyCard key={room.roomId} room={room} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
