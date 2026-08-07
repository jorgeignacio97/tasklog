import { Outlet, Link } from '@tanstack/react-router'
import {
  ListChecks,
  BarChart3,
  History,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useSidebarOpen, useToggleSidebar } from '../../stores/ui'

export default function AppShell() {
  const sidebarOpen = useSidebarOpen()
  const toggleSidebar = useToggleSidebar()

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-0'} transition-all overflow-hidden border-r border-zinc-800`}
      >
        <nav className="p-4 space-y-2">
          <Link
            to="/tasks"
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800"
          >
            <ListChecks size={18} /> Tareas
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800"
          >
            <BarChart3 size={18} /> Reportes
          </Link>
          <Link
            to="/reports/history"
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800"
          >
            <History size={18} /> Historial
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800"
          >
            <Settings size={18} /> Configuración
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <button
          onClick={toggleSidebar}
          className="mb-4 p-1 rounded hover:bg-zinc-800"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <Outlet />
      </main>
    </div>
  )
}
