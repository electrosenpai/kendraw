import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoSaveScheduler } from '../auto-save.js';
import type { Document } from '@kendraw/scene';

function mockDocument(id = 'doc-1'): Document {
  return {
    id,
    schemaVersion: 1,
    metadata: {
      title: 'Test',
      createdAt: '2026-04-12T00:00:00Z',
      modifiedAt: '2026-04-12T00:00:00Z',
      appVersion: '0.0.0',
    },
    pages: [],
    activePageIndex: 0,
  };
}

describe('AutoSaveScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls save after debounce period', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const scheduler = new AutoSaveScheduler(saveFn, 500);

    scheduler.schedule(mockDocument());
    expect(saveFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(saveFn).toHaveBeenCalledTimes(1);

    scheduler.dispose();
  });

  it('resets debounce on repeated calls', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const scheduler = new AutoSaveScheduler(saveFn, 500);

    scheduler.schedule(mockDocument());
    await vi.advanceTimersByTimeAsync(300);
    scheduler.schedule(mockDocument()); // reset
    await vi.advanceTimersByTimeAsync(300);
    expect(saveFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(saveFn).toHaveBeenCalledTimes(1);

    scheduler.dispose();
  });

  it('saves the latest document version', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const scheduler = new AutoSaveScheduler(saveFn, 500);

    scheduler.schedule(mockDocument('old'));
    scheduler.schedule(mockDocument('latest'));

    await vi.advanceTimersByTimeAsync(500);
    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn.mock.calls[0]?.[0]?.id).toBe('latest');

    scheduler.dispose();
  });

  it('dispose cancels pending save', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const scheduler = new AutoSaveScheduler(saveFn, 500);

    scheduler.schedule(mockDocument());
    scheduler.dispose();

    await vi.advanceTimersByTimeAsync(1000);
    expect(saveFn).not.toHaveBeenCalled();
  });
});
