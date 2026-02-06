import { LayoutDashboard, Users, FileText, Settings, Menu, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui'
import { Drawer } from './ui/drawer'
import { useState } from 'react'

type Page = 'dashboard' | 'personas' | 'posts' | 'trends' | 'schedules' | 'settings'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'personas' as Page, label: 'Personas', icon: Users },
  { id: 'posts' as Page, label: 'Posts', icon: FileText },
  { id: 'trends' as Page, label: 'Trends', icon: TrendingUp },
  { id: 'schedules' as Page, label: 'Schedules', icon: Calendar },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="Ghostwriter" className="w-11 h-11 drop-shadow-lg" />
      <div>
        <span className="text-lg font-bold text-white">
          Ghostwriter
        </span>
        <p className="text-[10px] text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
          AI Persona Engine
        </p>
      </div>
    </div>
  )
}

function NavItems({ currentPage, onNavigate, onItemClick }: SidebarProps & { onItemClick?: () => void }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.id
        
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id)
              onItemClick?.()
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              'active:scale-[0.98] touch-manipulation',
              isActive 
                ? 'bg-[rgb(var(--primary))] text-white shadow-md shadow-[rgb(var(--primary))/0.25]' 
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-sm')} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

// Desktop Sidebar
function DesktopSidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] flex-col">
      {/* Logo */}
      <div className="p-6">
        <Logo />
      </div>
      
      {/* Navigation */}
      <div className="flex-1 px-3">
        <NavItems currentPage={currentPage} onNavigate={onNavigate} />
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-[rgb(var(--border))]">
        <div className="px-3 py-2 rounded-lg bg-[rgb(var(--primary))/0.1] border border-[rgb(var(--primary))/0.2]">
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            AI-powered social content
          </p>
          <p className="text-[10px] text-[rgb(var(--muted-foreground))] opacity-75 mt-0.5">
            Powered by Claude
          </p>
        </div>
      </div>
    </aside>
  )
}

// Mobile Header + Drawer
function MobileNav({ currentPage, onNavigate }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] flex items-center justify-between px-4">
        <Logo />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOpen(true)}
          className="h-10 w-10"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} side="bottom">
        <div className="p-4 pb-8 safe-area-inset-bottom">
          <NavItems 
            currentPage={currentPage} 
            onNavigate={onNavigate} 
            onItemClick={() => setOpen(false)}
          />
          
          <div className="mt-6 px-3 py-3 rounded-lg bg-[rgb(var(--primary))/0.1] border border-[rgb(var(--primary))/0.2]">
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              AI-powered social content • Powered by Claude
            </p>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      <DesktopSidebar currentPage={currentPage} onNavigate={onNavigate} />
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </>
  )
}
