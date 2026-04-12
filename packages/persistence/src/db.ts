import Dexie from 'dexie';
import type { Document } from '@kendraw/scene';

export interface StoredDocument {
  id: string;
  data: Document;
  savedAt: string;
}

export class KendrawDB extends Dexie {
  documents!: Dexie.Table<StoredDocument, string>;

  constructor() {
    super('kendraw');
    this.version(1).stores({
      documents: 'id',
    });
  }

  async saveDocument(doc: Document): Promise<void> {
    await this.documents.put({
      id: doc.id,
      data: doc,
      savedAt: new Date().toISOString(),
    });
  }

  async loadDocument(id: string): Promise<StoredDocument | null> {
    const record = await this.documents.get(id);
    return record ?? null;
  }

  async listDocuments(): Promise<StoredDocument[]> {
    return this.documents.toArray();
  }

  async deleteDocument(id: string): Promise<void> {
    await this.documents.delete(id);
  }
}
