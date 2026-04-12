import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Canvas } from './Canvas';
import { TabBar } from './TabBar';
import { ShortcutCheatsheet } from './ShortcutCheatsheet';
import { AboutPage } from './AboutPage';
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    async function init() {
      await workspaceStore.restoreFromDB();
      if (workspaceStore.getState().tabs.length === 0) {
        workspaceStore.createTab();
      }
      setInitialized(true);
    }
    void init();
  }, []);

  // Global shortcuts: ? for cheatsheet, Ctrl+N for new tab
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?') {
        setShowShortcuts((s) => !s);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        workspaceStore.createTab();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          backgroundColor: 'var(--kd-color-bg-primary)',
          color: 'var(--kd-color-text-muted)',
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
              backgroundColor: 'var(--kd-color-bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kd-color-text-muted)',
            }}
          >
            No document open
          </div>
        )}
      </div>
      {showShortcuts && <ShortcutCheatsheet onClose={() => setShowShortcuts(false)} />}
      {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
    </div>
  );
}
