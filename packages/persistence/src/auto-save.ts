import type { Document } from '@kendraw/scene';

export class AutoSaveScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingDoc: Document | null = null;

  constructor(
    private saveFn: (doc: Document) => Promise<void>,
    private debounceMs: number = 5000,
  ) {}

  schedule(doc: Document): void {
    this.pendingDoc = doc;
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  dispose(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingDoc = null;
  }

  private flush(): void {
    const doc = this.pendingDoc;
    if (!doc) return;
    this.pendingDoc = null;
    this.timer = null;
    void this.saveFn(doc);
  }
}
