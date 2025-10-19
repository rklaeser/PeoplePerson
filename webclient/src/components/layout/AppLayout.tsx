import { useUIStore } from '@/stores/ui-store'
import { PeopleList } from './PeopleList'
import { PersonPanel } from './PersonPanel'
import { ChatPanel } from './ChatPanel'

export function AppLayout() {
  const { chatPanelOpen, setChatPanelOpen, viewMode } = useUIStore()

  return (
    <div className={viewMode === 'table' ? 'app-layout-table' : 'app-layout'}>
      <PeopleList />
      {viewMode === 'list' && <PersonPanel />}
      <ChatPanel
        isOpen={chatPanelOpen}
        onClose={() => setChatPanelOpen(false)}
      />
    </div>
  )
}