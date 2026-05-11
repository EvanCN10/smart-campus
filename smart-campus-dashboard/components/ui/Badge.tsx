import { cn } from '@/lib/Utils'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'muted'

interface BadgeProps {
  variant: BadgeVariant
  label: string
  pulse?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/20 text-success border-success/30',
  danger: 'bg-danger/20 text-danger border-danger/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  info: 'bg-accent/20 text-accent border-accent/30',
  muted: 'bg-surface text-text-muted border-border-main',
}

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-accent',
  muted: 'bg-text-muted',
}

export function Badge({ variant, label, pulse = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotStyles[variant]
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotStyles[variant])} />
      </span>
      {label}
    </span>
  )
}