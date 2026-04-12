import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Canvas } from './Canvas';
import { TabBar } from './TabBar';
import { workspaceStore, type WorkspaceState } from './workspace-store';

function subscribeToWorkspace(onStoreChange: () => void) {
  return workspaceStore.subscribe(onStoreChange);
}

function getWorkspaceSnapshot(): WorkspaceState {
  return workspaceStore.getState();
}

export function App() {
  const workspace = useSyncExternalStore(subscribeToWorkspace, getWorkspaceSnapshot);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      await workspaceStore.restoreFromDB();
      // If no documents restored, create a blank one
      if (workspaceStore.getState().tabs.length === 0) {
        workspaceStore.createTab();
      }
      setInitialized(true);
    }
    void init();
  }, []);

  const handleNewTab = useCallback(() => {
    workspaceStore.createTab();
  }, []);

  const handleSwitchTab = useCallback((id: string) => {
    workspaceStore.switchTab(id);
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    workspaceStore.closeTab(id);
  }, []);

  if (!initialized) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#888',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Loading...
      </div>
    );
  }

  const activeStore = workspaceStore.getActiveStore();

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TabBar
        tabs={workspace.tabs}
        activeTabId={workspace.activeTabId}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        {activeStore ? (
          <Canvas key={workspace.activeTabId} store={activeStore} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            No document open
          </div>
        )}
      </div>
    </div>
  );
}
