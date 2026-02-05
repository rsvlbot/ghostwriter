import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 text-[rgb(var(--muted-foreground))] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export { EmptyState }
