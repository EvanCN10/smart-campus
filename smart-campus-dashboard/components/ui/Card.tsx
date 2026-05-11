import { cn } from '@/lib/Utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glowOnHover?: boolean
}

export function Card({ children, className, glowOnHover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border-main rounded-2xl p-6 transition-all duration-200',
        glowOnHover && 'hover:border-accent/50 hover:shadow-[0_0_20px_rgba(79,195,232,0.1)]',
        className
      )}
    >
      {children}
    </div>
  )
}