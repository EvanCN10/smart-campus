import { Building2 } from 'lucide-react'
import { ConnectionStatus } from './ConnectionStatus'

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-primary/80 backdrop-blur-md border-b border-border-main flex items-center px-6">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Building2 size={16} className="text-accent" />
        </div>
        <div>
          <h1 className="text-text-primary font-bold text-sm leading-none">Smart Campus</h1>
          <p className="text-text-muted text-xs mt-0.5">Monitoring Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ConnectionStatus />
        <div className="text-text-muted text-xs font-mono">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>
    </header>
  )
}