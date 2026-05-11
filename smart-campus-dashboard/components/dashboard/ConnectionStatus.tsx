'use client'

import { useDashboardStore } from '@/store/useDashboardStore'
import { Badge } from '@/components/ui/Badge'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import type { MqttConnectionStatus } from '@/lib/types'

const statusConfig: Record<MqttConnectionStatus, {
  variant: 'success' | 'danger' | 'warning' | 'muted'
  label: string
  Icon: React.ElementType
}> = {
  connected: { variant: 'success', label: 'MQTT Connected', Icon: Wifi },
  connecting: { variant: 'warning', label: 'Connecting...', Icon: Loader2 },
  disconnected: { variant: 'muted', label: 'Disconnected', Icon: WifiOff },
  error: { variant: 'danger', label: 'Connection Error', Icon: WifiOff },
}

export function ConnectionStatus() {
  const connectionStatus = useDashboardStore((state) => state.connectionStatus)
  const { variant, label, Icon } = statusConfig[connectionStatus]

  return (
    <div className="flex items-center gap-2">
      <Icon
        size={16}
        className={`
          ${connectionStatus === 'connected' ? 'text-success' : ''}
          ${connectionStatus === 'connecting' ? 'text-warning animate-spin' : ''}
          ${connectionStatus === 'disconnected' ? 'text-text-muted' : ''}
          ${connectionStatus === 'error' ? 'text-danger' : ''}
        `}
      />
      <Badge
        variant={variant}
        label={label}
        pulse={connectionStatus === 'connected'}
      />
    </div>
  )
}