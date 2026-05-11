'use client'

// Custom hook ini dipakai di layout atau page utama
// untuk menginisialisasi koneksi MQTT saat app pertama load

import { useEffect } from 'react'
import { getMqttClient, disconnectMqtt } from '@/lib/mqtt-client'

export function useMqtt() {
  useEffect(() => {
    // Inisialisasi MQTT client saat component mount
    getMqttClient()

    return () => {
      disconnectMqtt()
    }
  }, []) 
}