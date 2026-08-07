import { create } from 'zustand'

type UIState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

export const useSidebarOpen = () => useUIStore((s) => s.sidebarOpen)
export const useToggleSidebar = () => useUIStore((s) => s.toggleSidebar)
