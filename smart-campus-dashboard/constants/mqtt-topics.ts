// Semua topic string didefinisikan di sini agar tidak typo
// Pattern: campus/{kategori}/{lokasi}/{metrik}

export const TOPICS = {
  // Subscribe semua sekaligus
  ALL: "campus/#",

  // Environment per ruangan
  ENVIRONMENT: {
    TEMPERATURE: (roomId: string) => `campus/environment/${roomId}/temperature`,
    HUMIDITY: (roomId: string) => `campus/environment/${roomId}/humidity`,
    AIR_QUALITY: (roomId: string) => `campus/environment/${roomId}/air-quality`,
    ALL: "campus/environment/#",
  },

  // Occupancy
  OCCUPANCY: {
    COUNT: (roomId: string) => `campus/occupancy/${roomId}/count`,
    ALL: "campus/occupancy/#",
  },

  // Security
  SECURITY: {
    MOTION: (location: string) => `campus/security/${location}/motion`,
    DOOR: (location: string) => `campus/security/${location}/door-status`,
  },

  // Alerts berdasarkan severity
  ALERTS: {
    CRITICAL: "campus/alerts/critical/#",
    WARNING: "campus/alerts/warning/#",
    INFO: "campus/alerts/info/#",
    ALL: "campus/alerts/#",
  },

  // System status (dikirim via LWT backend)
  SYSTEM: {
    SERVER: "campus/system/server/status",
    ALL: "campus/system/#",
  },

  // Announcement broadcast
  ANNOUNCEMENTS: "campus/announcements/broadcast",
} as const;
