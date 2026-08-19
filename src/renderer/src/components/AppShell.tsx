import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Bell,
  Car,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  Wrench,
  BarChart3
} from 'lucide-react'
import type { ThemeMode } from '../../../shared/types'
import GlobalSearchDialog from '@/components/GlobalSearchDialog'
import AppLogo from '@/components/AppLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, badgeKey: null as 'overdue' | 'due' | null },
  { to: '/vehicles', label: 'Vehicles', icon: Car, badgeKey: null },
  { to: '/entries', label: 'Entries', icon: Wrench, badgeKey: null },
  { to: '/reports', label: 'Reports', icon: BarChart3, badgeKey: null },
  { to: '/reminders', label: 'Reminders', icon: Bell, badgeKey: 'overdue' as const },
  { to: '/settings', label: 'Settings', icon: Settings, badgeKey: null }
]

interface Props {
  theme: ThemeMode
  onToggleTheme: () => void
  overdueCount?: number
  dueCount?: number
  children: ReactNode
}

export default function AppShell({
  theme,
  onToggleTheme,
  overdueCount = 0,
  dueCount = 0,
  children
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isK = event.key.toLowerCase() === 'k'
      if (!isK || (!event.ctrlKey && !event.metaKey)) return
      event.preventDefault()
      setSearchOpen((open) => !open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card/40">
        <div className="px-5 py-6">
          <AppLogo className="mb-3" />
          <h1 className="text-lg font-semibold tracking-tight">ServiceKeep</h1>
          <p className="text-xs text-muted-foreground">Local garage log</p>
        </div>

        <div className="px-3 pb-3">
          <Button
            variant="outline"
            className="w-full justify-between gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Search className="size-4" />
              Search
            </span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
              Ctrl K
            </kbd>
          </Button>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const badge =
              badgeKey === 'overdue' && overdueCount > 0
                ? overdueCount
                : badgeKey === 'due' && dueCount > 0
                  ? dueCount
                  : 0

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {badge > 0 ? (
                  <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 text-xs">
                    {badge}
                  </Badge>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
