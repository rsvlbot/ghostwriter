import { Ghost, LayoutDashboard, Users, FileText, Settings } from 'lucide-react'

type Page = 'dashboard' | 'personas' | 'posts' | 'settings'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'personas' as Page, label: 'Personas', icon: Users },
  { id: 'posts' as Page, label: 'Posts', icon: FileText },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Ghost className="w-8 h-8 text-blue-500" />
        <span className="text-xl font-bold">Ghostwriter</span>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
