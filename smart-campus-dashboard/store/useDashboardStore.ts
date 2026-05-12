import { create } from 'zustand'
import { DashboardState } from '@/lib/types'

// MAX_CHART_POINTS: berapa data point yang disimpan untuk chart
// Kalau backend kirim data tiap 3 detik, 40 point = ~2 menit history
const MAX_CHART_POINTS = 40
const MAX_ALERTS = 50

export const useDashboardStore = create<DashboardState>((set) => ({
  connectionStatus: 'connecting',
  environments: {},
  occupancies: {},
  chartHistory: {},
  alerts: [],
  systemStatus: {},
  latestAnnouncement: null,

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  updateEnvironment: (roomId, metric, data) =>
    set((state) => {
      // Update atau buat entry baru untuk ruangan ini
      const existing = state.environments[roomId] ?? {
        roomId,
        roomName: data.roomName,
        temperature: null,
        humidity: null,
        airQuality: null,
        lastUpdated: null,
      }

      const updated = {
        ...existing,
        [metric]: data.value,
        lastUpdated: data.timestamp,
      }

      // Tambah data point ke chart history
      const historyKey = `${roomId}-${metric}`
      const currentHistory = state.chartHistory[historyKey] ?? []
      const newPoint = {
        time: new Date(data.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        value: data.value,
      }

      const updatedHistory = [...currentHistory, newPoint].slice(-MAX_CHART_POINTS)

      return {
        environments: { ...state.environments, [roomId]: updated },
        chartHistory: { ...state.chartHistory, [historyKey]: updatedHistory },
      }
    }),

  updateOccupancy: (roomId, data) =>
    set((state) => {
      const historyKey = `${roomId}-occupancy`
      const currentHistory = state.chartHistory[historyKey] ?? []
      const newPoint = {
        time: new Date(data.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: data.count,
      }

      return {
        occupancies: {
          ...state.occupancies,
          [roomId]: {
            roomId,
            roomName: data.roomName,
            count: data.count,
            capacity: data.capacity,
            percentage: data.percentage,
            lastUpdated: data.timestamp,
          },
        },
        chartHistory: {
          ...state.chartHistory,
          [historyKey]: [...currentHistory, newPoint].slice(-MAX_CHART_POINTS),
        },
      }
    }),

  addAlert: (alert) =>
    set((state) => ({
      // Tambah di depan, potong kalau lebih dari MAX_ALERTS
      alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
    })),

  clearAlerts: () => set({ alerts: [] }),

  updateSystemStatus: (service, status) =>
    set((state) => ({
      systemStatus: { ...state.systemStatus, [service]: status },
    })),

  setAnnouncement: (data) => set({ latestAnnouncement: data }),
}))