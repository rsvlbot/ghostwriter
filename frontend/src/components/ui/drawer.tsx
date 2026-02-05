import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right' | 'bottom'
  className?: string
}

export function Drawer({ open, onClose, children, side = 'left', className }: DrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const sideStyles = {
    left: 'inset-y-0 left-0 w-[280px] border-r',
    right: 'inset-y-0 right-0 w-[280px] border-l',
    bottom: 'inset-x-0 bottom-0 h-auto max-h-[85vh] border-t rounded-t-2xl',
  }

  const slideStyles = {
    left: open ? 'translate-x-0' : '-translate-x-full',
    right: open ? 'translate-x-0' : 'translate-x-full',
    bottom: open ? 'translate-y-0' : 'translate-y-full',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed z-50 bg-[rgb(var(--card))] border-[rgb(var(--border))] transition-transform duration-300 ease-out',
          sideStyles[side],
          slideStyles[side],
          className
        )}
      >
        {side === 'bottom' && (
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-[rgb(var(--muted))]" />
          </div>
        )}
        {children}
      </div>
    </>
  )
}

interface DrawerHeaderProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function DrawerHeader({ children, onClose, className }: DrawerHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b border-[rgb(var(--border))]', className)}>
      <div className="font-semibold">{children}</div>
      {onClose && (
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export function DrawerContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4 overflow-auto', className)}>{children}</div>
}
