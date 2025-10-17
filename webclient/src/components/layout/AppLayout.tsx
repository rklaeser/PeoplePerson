import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { PeopleList } from './PeopleList'
import { PersonPanel } from './PersonPanel'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className={cn(
      "app-layout",
      sidebarCollapsed && "sidebar-collapsed"
    )}>
      <Sidebar />
      <PeopleList />
      <PersonPanel />
    </div>
  )
}