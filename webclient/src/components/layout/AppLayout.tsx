import { useUIStore } from '@/stores/ui-store'
import { PeopleList } from './PeopleList'
import { PersonPanel } from './PersonPanel'
import { ChatPanel } from './ChatPanel'
import { MapView } from '../MapView'
import { HamburgerMenu } from './HamburgerMenu'

export function AppLayout() {
  const { chatPanelOpen, setChatPanelOpen, viewMode } = useUIStore()

  return (
    <div className={viewMode === 'table' || viewMode === 'map' ? 'app-layout-table' : 'app-layout'}>
      <HamburgerMenu />
      {viewMode === 'map' ? (
        <MapView />
      ) : (
        <>
          <PeopleList />
          {viewMode === 'list' && <PersonPanel />}
        </>
      )}
      <ChatPanel
        isOpen={chatPanelOpen}
        onClose={() => setChatPanelOpen(false)}
      />
    </div>
  )
}