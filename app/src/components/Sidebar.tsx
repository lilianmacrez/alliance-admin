import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  CalendarDays,
  Building2,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/situations', label: 'Situations', icon: FolderOpen },
  { to: '/planning', label: 'Planning', icon: CalendarDays },
  { to: '/financeurs', label: 'Financeurs', icon: Building2 },
  { to: '/comptabilite', label: 'Comptabilité', icon: FileText },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
] as const

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="text-lg font-bold text-primary">Alliance</span>
        <span className="text-lg font-light text-sidebar-foreground">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
