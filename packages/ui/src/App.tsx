import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Canvas } from './Canvas';
import { TabBar } from './TabBar';
import { ShortcutCheatsheet } from './ShortcutCheatsheet';
import { AboutPage } from './AboutPage';
import { MoleculeSearch } from './MoleculeSearch';
import { workspaceStore, type WorkspaceState } from './workspace-store';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';

function subscribeToWorkspace(onStoreChange: () => void) {
  return workspaceStore.subscribe(onStoreChange);
}

function getWorkspaceSnapshot(): WorkspaceState {
  return workspaceStore.getState();
}

const TOOLBAR_DEFAULT = 56;
const PANEL_DEFAULT = 280;

export function App() {
  const workspace = useSyncExternalStore(subscribeToWorkspace, getWorkspaceSnapshot);
  const [initialized, setInitialized] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMolSearch, setShowMolSearch] = useState(false);
  const layout = useResponsiveLayout();

  // Panel widths (persisted in localStorage)
  const [toolbarW, setToolbarW] = useState(() => {
    const saved = localStorage.getItem('kd-toolbar-w');
    return saved ? parseInt(saved, 10) : TOOLBAR_DEFAULT;
  });
  const [panelW] = useState(() => {
    const saved = localStorage.getItem('kd-panel-w');
    return saved ? parseInt(saved, 10) : PANEL_DEFAULT;
  });
  const [panelVisible, setPanelVisible] = useState(true);

  // Persist widths
  useEffect(() => {
    localStorage.setItem('kd-toolbar-w', String(toolbarW));
  }, [toolbarW]);
  useEffect(() => {
    localStorage.setItem('kd-panel-w', String(panelW));
  }, [panelW]);

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?') {
        setShowShortcuts((s) => !s);
        return;
      }
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 'n') {
        e.preventDefault();
        workspaceStore.createTab();
      }
      if (isMod && (e.key === 'm' || e.key === 'l')) {
        e.preventDefault();
        setShowMolSearch((s) => !s);
      }
      if (isMod && e.key === 'b') {
        e.preventDefault();
        setToolbarW((w) => (w > 0 ? 0 : TOOLBAR_DEFAULT));
      }
      if (isMod && e.key === 'j') {
        e.preventDefault();
        setPanelVisible((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewTab = useCallback(() => workspaceStore.createTab(), []);
  const handleSwitchTab = useCallback((id: string) => workspaceStore.switchTab(id), []);
  const handleCloseTab = useCallback((id: string) => workspaceStore.closeTab(id), []);

  // Auto-collapse panel on small screens
  const effectivePanelW = layout === 'minimal' ? 0 : panelVisible ? panelW : 0;
  const effectiveToolbarW = layout === 'minimal' ? 44 : toolbarW;

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
    <div
      style={{
        display: 'grid',
        gridTemplateRows: '36px 1fr 24px',
        gridTemplateColumns: `${effectiveToolbarW}px 1fr ${effectivePanelW > 0 ? effectivePanelW + 'px' : '0px'}`,
        gridTemplateAreas: `
          "tabbar tabbar tabbar"
          "toolbar canvas properties"
          "status status status"
        `,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ gridArea: 'tabbar', minWidth: 0 }}>
        <TabBar
          tabs={workspace.tabs}
          activeTabId={workspace.activeTabId}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
        />
      </div>

      {activeStore ? (
        <Canvas
          key={workspace.activeTabId}
          store={activeStore}
          onMoleculeSearch={() => setShowMolSearch(true)}
          showPropertyPanel={panelVisible && effectivePanelW > 0}
        />
      ) : (
        <>
          <div style={{ gridArea: 'toolbar' }} />
          <div
            style={{
              gridArea: 'canvas',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kd-color-text-muted)',
            }}
          >
            No document open
          </div>
          <div style={{ gridArea: 'properties' }} />
          <div style={{ gridArea: 'status' }} />
        </>
      )}

      {showShortcuts && <ShortcutCheatsheet onClose={() => setShowShortcuts(false)} />}
      {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
      {showMolSearch && activeStore && (
        <MoleculeSearch store={activeStore} onClose={() => setShowMolSearch(false)} />
      )}
    </div>
  );
}
