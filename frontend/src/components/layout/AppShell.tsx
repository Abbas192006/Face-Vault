import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useUIStore } from '@/stores/ui-store'

export function AppShell() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="bg-background text-foreground font-body-md overflow-hidden flex h-screen w-full">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-sidebar-width border-primary/20">
          <Sidebar className="relative w-full border-0" onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 lg:ml-[280px] h-screen overflow-y-auto custom-scrollbar bg-background p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
