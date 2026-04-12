import type { Document } from '@kendraw/scene';

const KDX_FORMAT_VERSION = 1;

interface KdxEnvelope {
  formatVersion: number;
  appVersion: string;
  document: Document;
}

export function serializeKdx(doc: Document): string {
  const envelope: KdxEnvelope = {
    formatVersion: KDX_FORMAT_VERSION,
    appVersion: doc.metadata.appVersion,
    document: doc,
  };
  return JSON.stringify(envelope, null, 2);
}

export function deserializeKdx(json: string): Document {
  let envelope: KdxEnvelope;
  try {
    envelope = JSON.parse(json) as KdxEnvelope;
  } catch {
    throw new Error('Invalid KDX file: malformed JSON');
  }
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Invalid KDX file: not an object');
  }
  if (envelope.formatVersion !== KDX_FORMAT_VERSION) {
    throw new Error(`Unsupported KDX format version: ${envelope.formatVersion}`);
  }
  if (!envelope.document) {
    throw new Error('Invalid KDX file: missing document');
  }
  return envelope.document;
}
