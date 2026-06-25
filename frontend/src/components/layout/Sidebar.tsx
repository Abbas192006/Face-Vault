import { UserButton, SignOutButton } from '@clerk/clerk-react'
import {
  CalendarDays,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  FolderHeart,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/workspace', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/history', label: 'History', icon: History },
  { to: '/recent', label: 'Recent Images', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'bg-surface fixed left-0 top-0 h-screen w-sidebar-width border-r border-primary/20 flex flex-col p-6 gap-4 z-40',
        className,
      )}
    >
      <div className="mb-6">
        <h1 className="font-headline-md text-headline-md font-extrabold tracking-tighter">
          <span style={{ background: 'linear-gradient(90deg, #00F5D4, #00BBF9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Face</span>
          <span className="text-on-surface">Vault</span>
          <span style={{ background: 'linear-gradient(90deg, #00BBF9, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Pro</span>
        </h1>
        <div className="flex items-center gap-4 mt-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { avatarBox: 'w-10 h-10 border border-primary/20 rounded-full' },
            }}
          />
          <div>
            <p className="font-label-md text-label-md text-on-surface">Photographer Profile</p>
            <p className="text-xs text-on-surface-variant">Elite Account</p>
          </div>
        </div>
      </div>

      <Button
        className="mb-4"
        onClick={() => {
          navigate('/events?new=true')
          onNavigate?.()
        }}
      >
        <Plus className="h-4 w-4" />
        New Event
      </Button>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 font-label-md text-label-md p-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-primary relative before:content-[""] before:absolute before:-left-4 before:w-1 before:h-4 before:bg-primary before:rounded-full'
                  : 'text-on-surface-variant hover:text-on-surface',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-primary/20" />

      <div className="space-y-1 pt-2">
        <button
          type="button"
          onClick={() => window.open('https://facevault.ai/docs', '_blank')}
          className="text-on-surface-variant flex items-center gap-4 font-label-md text-label-md p-2 hover:text-on-surface transition-all duration-200 w-full"
        >
          <HelpCircle className="h-5 w-5" />
          Help
        </button>
        <SignOutButton>
          <button
            type="button"
            className="text-on-surface-variant flex items-center gap-4 font-label-md text-label-md p-2 hover:text-on-surface transition-all duration-200 w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}
