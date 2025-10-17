import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UIStore {
  // Sidebar state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Right panel state
  rightPanelWidth: number
  setRightPanelWidth: (width: number) => void

  // UI preferences
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Composer state
  composerExpanded: boolean
  setComposerExpanded: (expanded: boolean) => void

  // Mobile responsive
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      // Right panel state
      rightPanelWidth: 400,
      setRightPanelWidth: (width) => set({ rightPanelWidth: Math.max(300, Math.min(600, width)) }),

      // UI preferences
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Composer state
      composerExpanded: false,
      setComposerExpanded: (expanded) => set({ composerExpanded: expanded }),

      // Mobile responsive
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'peopleperson-ui-store',
      // Only persist certain values
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        rightPanelWidth: state.rightPanelWidth,
        theme: state.theme,
        composerExpanded: state.composerExpanded,
      }),
    }
  )
)