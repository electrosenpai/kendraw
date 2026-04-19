import { useRef, useState, useEffect, useCallback, useMemo, useSyncExternalStore, lazy, Suspense, type ReactElement } from 'react';
import type { AtomId, Document } from '@kendraw/scene';
import { validateValence } from '@kendraw/scene';
import { Canvas } from './Canvas';
import { FEATURE_FLAGS } from './config/feature-flags';
const LazyCanvasNew = lazy(() => import('./canvas-new'));
import { NewToolbox, CANVAS_REGISTRY_MAP, useToolHotkeys } from './canvas-new/NewToolbox';
import type { NewToolboxActionId, NewToolboxToolId } from './canvas-new/NewToolbox';
import type { CanvasNewHandle, CanvasNewProps, CanvasNewToolId } from './canvas-new/CanvasNew';
import { cleanStructure, type CleanMode } from './canvas-new/structureClean';
import { KetcherCanvasMode } from './canvas-ketcher';
import { PropertyPanel } from './PropertyPanel';
import { StatusBar } from './StatusBar';
import { DEFAULT_TOOL_STATE, type ToolState } from './ToolPalette';
import { TabBar } from './TabBar';
import { ShortcutCheatsheet } from './ShortcutCheatsheet';
import { AboutPage } from './AboutPage';
import { MoleculeSearch } from './MoleculeSearch';
import { ImportDialog } from './ImportDialog';
import { RecoveryBanner } from './RecoveryBanner';
import { workspaceStore, type WorkspaceState } from './workspace-store';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { isEditingTextNow } from './hooks/useIsEditingText';

const LazyNmrPanel = lazy(() => import('@kendraw/nmr'));

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
  const [showImport, setShowImport] = useState(false);
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
  const [nmrOpen, setNmrOpen] = useState(false);
  const [nmrHeight, setNmrHeight] = useState(() => {
    const saved = localStorage.getItem('kd-nmr-h');
    return saved ? parseInt(saved, 10) : Math.round(window.innerHeight * 0.33);
  });
  const [highlightedAtomIds, setHighlightedAtomIds] = useState<Set<AtomId>>(new Set());
  const [selectedAtomIds, setSelectedAtomIds] = useState<AtomId[]>([]);
  // Wave-5 hotfix: when newCanvas flag is on, the toolbox + canvas are
  // swapped but the rest of the shell (header, properties, NMR, status
  // bar) stays shared. This piece of state drives the new <NewToolbox />
  // and <CanvasNew />.
  const [newCanvasActiveTool, setNewCanvasActiveTool] = useState<NewToolboxToolId>('select');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('kd-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('kd-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist widths
  useEffect(() => {
    localStorage.setItem('kd-toolbar-w', String(toolbarW));
  }, [toolbarW]);
  useEffect(() => {
    localStorage.setItem('kd-panel-w', String(panelW));
  }, [panelW]);
  useEffect(() => {
    localStorage.setItem('kd-nmr-h', String(nmrHeight));
  }, [nmrHeight]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await workspaceStore.restoreFromDB();
      if (cancelled) return;
      if (workspaceStore.getState().tabs.length === 0) {
        workspaceStore.createTab();
      }
      setInitialized(true);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const showRecoveryBanner = initialized && workspaceStore.shouldShowRecoveryBanner();
  const recoveryCount = workspaceStore.getRestoredCount();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      if (e.isComposing) return;
      if (e.key === '?') {
        setShowShortcuts((s) => !s);
        return;
      }
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 'n') {
        e.preventDefault();
        workspaceStore.createTab();
      }
      if (isMod && e.key === 'm' && !e.shiftKey) {
        e.preventDefault();
        setNmrOpen((v) => !v);
        return;
      }
      if (isMod && e.key === 'l' && !e.shiftKey) {
        e.preventDefault();
        setShowMolSearch((s) => !s);
      }
      if (isMod && e.key === 'i') {
        e.preventDefault();
        setShowImport((s) => !s);
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
  const handleRenameTab = useCallback(
    (id: string, name: string) => workspaceStore.renameTab(id, name),
    [],
  );

  // Auto-collapse panel on small screens
  const effectivePanelW = layout === 'minimal' ? 0 : panelVisible ? panelW : 0;
  // Wave-7 hotfix: the new-canvas toolbox needs room for a 2-column grid
  // (~80px). Legacy mode keeps the narrower 56px default so flag=false is
  // visually unchanged.
  const NEW_CANVAS_MIN_TOOLBAR = 80;
  const effectiveToolbarW = layout === 'minimal'
    ? 44
    : FEATURE_FLAGS.newCanvas
      ? Math.max(NEW_CANVAS_MIN_TOOLBAR, toolbarW)
      : toolbarW;

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
        gridTemplateRows: nmrOpen ? `36px 1fr ${nmrHeight}px 24px` : '36px 1fr 24px',
        gridTemplateColumns: `${effectiveToolbarW}px 1fr ${effectivePanelW > 0 ? effectivePanelW + 'px' : '0px'}`,
        gridTemplateAreas: nmrOpen
          ? `
          "tabbar tabbar tabbar"
          "toolbar canvas properties"
          "nmr nmr nmr"
          "status status status"
        `
          : `
          "tabbar tabbar tabbar"
          "toolbar canvas properties"
          "status status status"
        `,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ gridArea: 'tabbar', minWidth: 0 }} data-testid="app-header">
        <TabBar
          tabs={workspace.tabs}
          activeTabId={workspace.activeTabId}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onRenameTab={handleRenameTab}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        />
      </div>

      {activeStore ? (
        ((): ReactElement => {
          const canvasProps = {
            key: workspace.activeTabId,
            store: activeStore,
            onMoleculeSearch: () => setShowMolSearch(true),
            onImportFile: () => setShowImport(true),
            showPropertyPanel: panelVisible && effectivePanelW > 0,
            nmrOpen,
            onNmrToggle: () => setNmrOpen((v) => !v),
            highlightedAtomIds,
            onHighlightAtoms: setHighlightedAtomIds,
            onSelectionChange: setSelectedAtomIds,
            theme,
          };
          if (FEATURE_FLAGS.useKetcher) {
            return (
              <KetcherCanvasMode
                nmrOpen={nmrOpen}
                onNmrToggle={() => setNmrOpen((v) => !v)}
                nmrHeight={nmrHeight}
                onNmrHeightChange={setNmrHeight}
                showProperties={panelVisible && effectivePanelW > 0}
                highlightedAtomIds={highlightedAtomIds}
                onHighlightAtoms={setHighlightedAtomIds}
                selectedAtomIds={selectedAtomIds}
              />
            );
          }
          return FEATURE_FLAGS.newCanvas ? (
            <NewCanvasMode
              canvasProps={canvasProps}
              activeTool={newCanvasActiveTool}
              onActiveToolChange={setNewCanvasActiveTool}
              activeStore={activeStore}
              showProperties={panelVisible && effectivePanelW > 0}
              selectionCount={selectedAtomIds.length}
              nmrOpen={nmrOpen}
              onNmrToggle={() => setNmrOpen((v) => !v)}
              onTogglePropertyPanel={() => setPanelVisible((v) => !v)}
              onPasteSmiles={() => setShowImport(true)}
              onSearchMolecule={() => setShowMolSearch(true)}
            />
          ) : (
            <Canvas {...canvasProps} />
          );
        })()
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

      {nmrOpen && activeStore && !FEATURE_FLAGS.useKetcher && (
        <div data-testid="nmr-panel" style={{ gridArea: 'nmr' }}>
          <Suspense
            fallback={
              <div
                style={{
                  height: nmrHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--kd-glass-bg)',
                  color: 'var(--kd-color-text-muted)',
                  fontSize: 12,
                }}
              >
                Loading NMR...
              </div>
            }
          >
            <LazyNmrPanel
              store={activeStore}
              onClose={() => setNmrOpen(false)}
              height={nmrHeight}
              onHeightChange={setNmrHeight}
              highlightedAtomIds={highlightedAtomIds}
              onHighlightAtoms={setHighlightedAtomIds}
              selectedAtomIds={selectedAtomIds}
            />
          </Suspense>
        </div>
      )}

      {showRecoveryBanner && (
        <RecoveryBanner
          count={recoveryCount}
          onKeep={() => workspaceStore.dismissRecoveryBanner()}
          onDiscard={() => {
            void workspaceStore.discardRecoveredTabs().then(() => {
              if (workspaceStore.getState().tabs.length === 0) {
                workspaceStore.createTab();
              }
            });
          }}
        />
      )}

      {showShortcuts && <ShortcutCheatsheet onClose={() => setShowShortcuts(false)} />}
      {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
      {showMolSearch && activeStore && (
        <MoleculeSearch store={activeStore} onClose={() => setShowMolSearch(false)} />
      )}
      {showImport && activeStore && (
        <ImportDialog store={activeStore} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}

// ── Wave-5 hotfix shell composition ────────────────────────────────────
// The newCanvas feature flag MUST scope to two zones only: the toolbox
// (left) and the drawing canvas (centre). Header, properties panel, NMR
// panel and status bar are shared across both modes — they live in App.tsx
// outside the swap. NewCanvasMode wires the new toolbox + canvas + the
// shared right/bottom panels into the same CSS grid areas so flag=true
// renders a complete app shell.

interface NewCanvasModeProps {
  canvasProps: CanvasNewProps & { key?: string | null };
  activeTool: NewToolboxToolId;
  onActiveToolChange: (id: NewToolboxToolId) => void;
  activeStore: NonNullable<ReturnType<typeof workspaceStore.getActiveStore>>;
  showProperties: boolean;
  selectionCount: number;
  nmrOpen: boolean;
  onNmrToggle: () => void;
  onTogglePropertyPanel: () => void;
  onPasteSmiles: () => void;
  onSearchMolecule: () => void;
}

function NewCanvasMode({
  canvasProps,
  activeTool,
  onActiveToolChange,
  activeStore,
  showProperties,
  selectionCount,
  nmrOpen,
  onNmrToggle,
  onTogglePropertyPanel,
  onPasteSmiles,
  onSearchMolecule,
}: NewCanvasModeProps): ReactElement {
  const doc = useSyncExternalStore<Document>(
    useCallback((cb) => activeStore.subscribe(cb), [activeStore]),
    useCallback(() => activeStore.getState(), [activeStore]),
  );
  const page = doc.pages[doc.activePageIndex];
  const atomCount = page ? Object.keys(page.atoms).length : 0;
  const bondCount = page ? Object.keys(page.bonds).length : 0;
  const valenceWarnings = useMemo(
    () => (page ? validateValence(page).length : 0),
    [page],
  );

  const canvasTool: CanvasNewToolId =
    (CANVAS_REGISTRY_MAP[activeTool] as CanvasNewToolId | undefined) ?? 'select';
  const toolState: ToolState = useMemo(
    () => ({
      ...DEFAULT_TOOL_STATE,
      tool: canvasTool.startsWith('bond-') ? 'add-bond' : 'select',
    }),
    [canvasTool],
  );

  const canvasNewRef = useRef<CanvasNewHandle | null>(null);

  const runStructureClean = useCallback(
    (mode: CleanMode): void => {
      const state = activeStore.getState();
      const page = state.pages[state.activePageIndex];
      if (!page) return;
      void cleanStructure(
        {
          atoms: Object.values(page.atoms),
          bonds: Object.values(page.bonds),
          dispatch: (cmd) => activeStore.dispatch(cmd),
        },
        mode,
      );
    },
    [activeStore],
  );

  const handleAction = useCallback(
    (id: NewToolboxActionId): void => {
      switch (id) {
        case 'undo':
          activeStore.undo();
          break;
        case 'redo':
          activeStore.redo();
          break;
        case 'fit-to-view':
          canvasNewRef.current?.fitToView();
          break;
        case 'structure-clean':
          runStructureClean('quick');
          break;
        case 'structure-refine':
          runStructureClean('full');
          break;
        case 'nmr-toggle':
          onNmrToggle();
          break;
        case 'property-toggle':
          onTogglePropertyPanel();
          break;
        case 'paste-smiles':
          onPasteSmiles();
          break;
        case 'search-molecule':
          onSearchMolecule();
          break;
      }
    },
    [
      activeStore,
      runStructureClean,
      onNmrToggle,
      onTogglePropertyPanel,
      onPasteSmiles,
      onSearchMolecule,
    ],
  );

  useToolHotkeys(onActiveToolChange, { onAction: handleAction });

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!e.shiftKey) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (isEditingTextNow()) return;
      const k = e.key.toLowerCase();
      if (k === 'k') {
        e.preventDefault();
        runStructureClean('quick');
      } else if (k === 'l') {
        e.preventDefault();
        runStructureClean('full');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runStructureClean]);

  return (
    <>
      <div style={{ gridArea: 'toolbar', overflow: 'hidden' }}>
        <NewToolbox
          activeToolId={activeTool}
          onToolChange={onActiveToolChange}
          onAction={handleAction}
          nmrOpen={nmrOpen}
          propertyPanelVisible={showProperties}
          canUndo={activeStore.canUndo()}
          canRedo={activeStore.canRedo()}
        />
      </div>
      <Suspense fallback={<div style={{ gridArea: 'canvas' }}>Loading canvas…</div>}>
        <LazyCanvasNew {...canvasProps} ref={canvasNewRef} activeToolId={canvasTool} />
      </Suspense>
      <div style={{ gridArea: 'properties', overflow: 'auto' }}>
        <PropertyPanel doc={doc} visible={showProperties} />
      </div>
      <div style={{ gridArea: 'status' }}>
        <StatusBar
          toolState={toolState}
          zoom={1}
          atomCount={atomCount}
          bondCount={bondCount}
          selectionCount={selectionCount}
          valenceWarnings={valenceWarnings}
          cursorPos={null}
        />
      </div>
    </>
  );
}
