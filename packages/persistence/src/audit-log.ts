/**
 * Append-only audit trail with SHA-256 hash chain — Wave-4 P1-04.
 *
 * Why an audit trail?
 *   Pharma QC/GMP and 21 CFR Part 11 require that every change to a
 *   regulated record can be traced back to *who*, *what*, *when* and that
 *   the record cannot be silently mutated after the fact. Kumar (pharma
 *   panelist) flagged this as a hard blocker: "no audit trail = no use in
 *   a GMP environment."
 *
 * What this module provides (Beta):
 *   - A monotonic, gap-detecting counter `seq` so missing entries are
 *     visible.
 *   - A SHA-256 chain where each entry's `hash` covers its full payload
 *     plus the previous entry's `hash`. Tampering with any historical
 *     entry breaks every subsequent hash and is caught by `verify()`.
 *   - A pure data model — storage is the caller's choice (IndexedDB,
 *     remote DB, file). The {@link InMemoryAuditLog} is provided for
 *     tests and small sessions.
 *
 * What this is not (deferred):
 *   - Cryptographic identity. The `actor` field is whatever the caller
 *     passes — there is no signature key per user yet. Combined with the
 *     hash chain this is "tamper-evident", not "non-repudiable".
 *   - 21 CFR Part 11 §11.30 e-signatures (separate scope, P1-05).
 *   - Time anchoring. Timestamps are wall-clock from the calling host.
 *
 * Reference: FDA 21 CFR Part 11 §11.10(e), §11.10(k); EU Annex 11 §9.
 */

/**
 * Action types we record. Kept open-ended (string) so callers can extend
 * without modifying this module, but a handful of canonical names are
 * exported as constants for IDE autocomplete and grepability.
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  IMPORT: 'import',
  EXPORT: 'export',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  SIGN: 'sign',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

/**
 * One immutable row in the audit trail.
 *
 *  - `seq` is a 1-based monotonic counter assigned at append time.
 *  - `prevHash` is the hash of the previous entry, or the empty string
 *    for the genesis entry. Linking via the previous hash (rather than
 *    only seq) means that re-numbering rows does not let a forger hide
 *    their tracks.
 *  - `hash` is `SHA-256(prevHash | seq | timestamp | actor | action |
 *    target | reason | payloadJson)`. Field separator is the ASCII unit
 *    separator (0x1F) so payload contents cannot collide with it.
 */
export interface AuditEntry {
  seq: number;
  timestamp: string;
  actor: string;
  action: AuditAction;
  /** Optional logical target — usually a document id, atom id, etc. */
  target: string | null;
  /** Optional human-readable reason, required by P1-05 e-sign flow. */
  reason: string | null;
  /** Free-form structured payload — small JSON-serialisable object. */
  payload: unknown;
  prevHash: string;
  hash: string;
}

/** Input shape for `append()` — the chain bookkeeping is filled in by the log. */
export interface AuditAppendInput {
  actor: string;
  action: AuditAction;
  target?: string | null;
  reason?: string | null;
  payload?: unknown;
  /** Optional override for tests. Production callers should omit. */
  timestamp?: string;
}

/** Result of {@link verifyAuditChain}. Always describes the *first* break. */
export type VerifyResult =
  | { ok: true; length: number }
  | {
      ok: false;
      length: number;
      /** seq number where the chain first failed to verify. */
      brokenAtSeq: number;
      reason:
        | 'sequence-gap'
        | 'sequence-restart'
        | 'previous-hash-mismatch'
        | 'hash-mismatch';
    };

/** Field separator (ASCII unit separator, 0x1F) used inside hash inputs. */
const SEP = '\u001F';

/**
 * Return a stable JSON serialisation of `value`. Stable means object keys
 * are sorted recursively so that `{a:1,b:2}` and `{b:2,a:1}` hash to the
 * same value. Without this, two equivalent payloads could chain to
 * different hashes depending on insertion order.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, replacer);

  function replacer(_key: string, v: unknown): unknown {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(obj).sort()) {
        sorted[k] = obj[k];
      }
      return sorted;
    }
    return v;
  }
}

/**
 * Concatenate audit fields into the canonical hash input. Exported for
 * tests so we can verify the hash format is what we documented.
 */
export function canonicalHashInput(entry: Omit<AuditEntry, 'hash'>): string {
  return [
    entry.prevHash,
    String(entry.seq),
    entry.timestamp,
    entry.actor,
    entry.action,
    entry.target ?? '',
    entry.reason ?? '',
    stableStringify(entry.payload ?? null),
  ].join(SEP);
}

/**
 * SHA-256 → lowercase hex string. Uses the Web Crypto API which is
 * available in modern browsers and Node 19+ via `globalThis.crypto`.
 */
export async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('audit-log: crypto.subtle is unavailable in this environment');
  }
  const buf = new TextEncoder().encode(input);
  const digest = await subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Append-only, hash-chained audit log held in memory. Intended for
 * tests, demos, and the in-tab session before the user opts in to
 * persistent storage. Pair with {@link KendrawDB} (or a remote sink) to
 * persist entries.
 *
 * The log is a single linked chain — there is no notion of branches or
 * forks. Once an entry is appended it is final; the only supported
 * mutation is *adding* more entries.
 */
export class InMemoryAuditLog {
  private readonly entries: AuditEntry[] = [];

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async append(input: AuditAppendInput): Promise<AuditEntry> {
    const last = this.entries[this.entries.length - 1];
    const seq = (last?.seq ?? 0) + 1;
    const prevHash = last?.hash ?? '';
    const partial: Omit<AuditEntry, 'hash'> = {
      seq,
      timestamp: input.timestamp ?? this.now(),
      actor: input.actor,
      action: input.action,
      target: input.target ?? null,
      reason: input.reason ?? null,
      payload: input.payload ?? null,
      prevHash,
    };
    const hash = await sha256Hex(canonicalHashInput(partial));
    const entry: AuditEntry = { ...partial, hash };
    this.entries.push(entry);
    return entry;
  }

  list(): AuditEntry[] {
    // Return a defensive copy so callers cannot mutate the internal log.
    return this.entries.map((e) => ({ ...e }));
  }

  size(): number {
    return this.entries.length;
  }

  async verify(): Promise<VerifyResult> {
    return verifyAuditChain(this.entries);
  }
}

/**
 * Validate a sequence of audit entries against the chain rules.
 * Designed for offline integrity checks (e.g. when reading the log back
 * from disk or showing it in a viewer).
 */
export async function verifyAuditChain(entries: readonly AuditEntry[]): Promise<VerifyResult> {
  let expectedSeq = 1;
  let expectedPrevHash = '';
  for (const entry of entries) {
    if (entry.seq !== expectedSeq) {
      return {
        ok: false,
        length: entries.length,
        brokenAtSeq: entry.seq,
        reason: entry.seq < expectedSeq ? 'sequence-restart' : 'sequence-gap',
      };
    }
    if (entry.prevHash !== expectedPrevHash) {
      return {
        ok: false,
        length: entries.length,
        brokenAtSeq: entry.seq,
        reason: 'previous-hash-mismatch',
      };
    }
    const recomputed = await sha256Hex(
      canonicalHashInput({
        seq: entry.seq,
        timestamp: entry.timestamp,
        actor: entry.actor,
        action: entry.action,
        target: entry.target,
        reason: entry.reason,
        payload: entry.payload,
        prevHash: entry.prevHash,
      }),
    );
    if (recomputed !== entry.hash) {
      return {
        ok: false,
        length: entries.length,
        brokenAtSeq: entry.seq,
        reason: 'hash-mismatch',
      };
    }
    expectedSeq += 1;
    expectedPrevHash = entry.hash;
  }
  return { ok: true, length: entries.length };
}
