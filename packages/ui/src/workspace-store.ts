import {
  createSceneStore,
  createEmptyDocument,
  type SceneStore,
  type Document,
  type AtomId,
} from '@kendraw/scene';
import { KendrawDB, AutoSaveScheduler } from '@kendraw/persistence';

export interface TabInfo {
  id: string;
  title: string;
}

export interface WorkspaceState {
  tabs: TabInfo[];
  activeTabId: string | null;
}

type WorkspaceListener = (state: WorkspaceState) => void;

const db = new KendrawDB();

class WorkspaceStore {
  private stores = new Map<string, SceneStore>();
  private state: WorkspaceState = { tabs: [], activeTabId: null };
  private listeners = new Set<WorkspaceListener>();
  private autoSaveSchedulers = new Map<string, AutoSaveScheduler>();
  private _highlightedAtomIds: Set<AtomId> = new Set();
  private _restoredCount = 0;
  private _restoredDismissed = false;

  getState(): WorkspaceState {
    return this.state;
  }

  getActiveStore(): SceneStore | null {
    if (!this.state.activeTabId) return null;
    return this.stores.get(this.state.activeTabId) ?? null;
  }

  getStore(id: string): SceneStore | null {
    return this.stores.get(id) ?? null;
  }

  subscribe(listener: WorkspaceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  createTab(doc?: Document): string {
    const d = doc ?? createEmptyDocument();
    const store = createSceneStore(d);
    this.stores.set(d.id, store);

    // Set up auto-save for this tab
    const scheduler = new AutoSaveScheduler((document) => db.saveDocument(document), 3000);
    this.autoSaveSchedulers.set(d.id, scheduler);
    store.subscribe((state) => {
      scheduler.schedule(state);
      // Update tab title if metadata changed
      this.updateTabTitle(d.id, state.metadata.title);
    });

    this.state = {
      tabs: [...this.state.tabs, { id: d.id, title: d.metadata.title }],
      activeTabId: d.id,
    };
    this.notify();
    return d.id;
  }

  switchTab(id: string): void {
    if (!this.stores.has(id)) return;
    this.state = { ...this.state, activeTabId: id };
    this.notify();
  }

  closeTab(id: string): void {
    const scheduler = this.autoSaveSchedulers.get(id);
    if (scheduler) {
      scheduler.dispose();
      this.autoSaveSchedulers.delete(id);
    }
    this.stores.delete(id);
    const tabs = this.state.tabs.filter((t) => t.id !== id);
    let activeTabId = this.state.activeTabId;
    if (activeTabId === id) {
      activeTabId = tabs[0]?.id ?? null;
    }
    this.state = { tabs, activeTabId };
    this.notify();
  }

  renameTab(id: string, name: string): void {
    const store = this.stores.get(id);
    if (store) {
      const doc = store.getState();
      doc.metadata.title = name;
    }
    this.updateTabTitle(id, name);
  }

  getHighlightedAtomIds(): Set<AtomId> {
    return this._highlightedAtomIds;
  }

  setHighlightedAtoms(ids: Set<AtomId>): void {
    this._highlightedAtomIds = ids;
    this.notify();
  }

  clearHighlightedAtoms(): void {
    if (this._highlightedAtomIds.size === 0) return;
    this._highlightedAtomIds = new Set();
    this.notify();
  }

  private restored = false;

  async restoreFromDB(): Promise<void> {
    // Guard against double-call (React StrictMode runs effects twice)
    if (this.restored) return;
    this.restored = true;

    try {
      const stored = await db.listDocuments();
      if (stored.length === 0) return;
      this._restoredCount = stored.length;
      for (const record of stored) {
        this.createTab(record.data);
      }
      // Activate the first tab
      if (this.state.tabs[0]) {
        this.state = { ...this.state, activeTabId: this.state.tabs[0].id };
        this.notify();
      }
    } catch {
      // IndexedDB unavailable (private mode, quota, storage denied).
      // Silently continue with an empty workspace.
      this._restoredCount = 0;
    }
  }

  /** Number of tabs restored from IndexedDB on the last restoreFromDB call. */
  getRestoredCount(): number {
    return this._restoredCount;
  }

  /** Whether the recovery banner should currently be shown to the user. */
  shouldShowRecoveryBanner(): boolean {
    return this._restoredCount > 0 && !this._restoredDismissed;
  }

  /** User acknowledged the banner — keep all restored tabs. */
  dismissRecoveryBanner(): void {
    this._restoredDismissed = true;
    this.notify();
  }

  /** User chose to discard — delete every stored document and clear tabs. */
  async discardRecoveredTabs(): Promise<void> {
    const ids = this.state.tabs.map((t) => t.id);
    for (const id of ids) {
      try {
        await db.deleteDocument(id);
      } catch {
        // Ignore — banner will still dismiss so UI does not re-appear.
      }
      const scheduler = this.autoSaveSchedulers.get(id);
      if (scheduler) {
        scheduler.dispose();
        this.autoSaveSchedulers.delete(id);
      }
      this.stores.delete(id);
    }
    this._restoredCount = 0;
    this._restoredDismissed = true;
    this.state = { tabs: [], activeTabId: null };
    this.notify();
  }

  private updateTabTitle(id: string, title: string): void {
    const tab = this.state.tabs.find((t) => t.id === id);
    if (tab && tab.title !== title) {
      tab.title = title;
      this.state = { ...this.state, tabs: [...this.state.tabs] };
      this.notify();
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const workspaceStore = new WorkspaceStore();
