import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { KendrawDB } from '../db.js';
import type { Document } from '@kendraw/scene';

function mockDocument(overrides?: Partial<Document>): Document {
  return {
    id: overrides?.id ?? 'doc-1',
    schemaVersion: 1,
    metadata: {
      title: overrides?.metadata?.title ?? 'Test Doc',
      createdAt: '2026-04-12T00:00:00Z',
      modifiedAt: '2026-04-12T00:00:00Z',
      appVersion: '0.0.0',
    },
    pages: [],
    activePageIndex: 0,
    ...overrides,
  };
}

describe('KendrawDB', () => {
  let db: KendrawDB;

  beforeEach(() => {
    db = new KendrawDB();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  describe('saveDocument / loadDocument', () => {
    it('saves and loads a document', async () => {
      const doc = mockDocument();
      await db.saveDocument(doc);

      const loaded = await db.loadDocument('doc-1');
      expect(loaded).not.toBeNull();
      expect(loaded?.data.metadata.title).toBe('Test Doc');
    });

    it('returns null for non-existent document', async () => {
      const loaded = await db.loadDocument('non-existent');
      expect(loaded).toBeNull();
    });

    it('overwrites on re-save', async () => {
      const doc = mockDocument();
      await db.saveDocument(doc);

      const updated = mockDocument({ metadata: { ...doc.metadata, title: 'Updated' } });
      await db.saveDocument(updated);

      const loaded = await db.loadDocument('doc-1');
      expect(loaded?.data.metadata.title).toBe('Updated');
    });
  });

  describe('listDocuments', () => {
    it('returns empty array initially', async () => {
      const list = await db.listDocuments();
      expect(list).toEqual([]);
    });

    it('lists saved documents', async () => {
      await db.saveDocument(mockDocument({ id: 'doc-1' }));
      await db.saveDocument(mockDocument({ id: 'doc-2' }));

      const list = await db.listDocuments();
      expect(list).toHaveLength(2);
    });
  });

  describe('deleteDocument', () => {
    it('removes a document', async () => {
      await db.saveDocument(mockDocument());
      await db.deleteDocument('doc-1');

      const loaded = await db.loadDocument('doc-1');
      expect(loaded).toBeNull();
    });
  });
});
