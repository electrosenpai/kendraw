/**
 * Record lock + electronic signature primitives — Wave-4 P1-05 (Beta).
 *
 * Why?
 *   21 CFR Part 11 §11.10(c)/(d) requires that finalised records be
 *   protected against further modification, and §11.30 / §11.50 require
 *   that any "signing" event records the signer, the timestamp, and the
 *   meaning of the signature ("approved", "reviewed", etc.). Kumar (pharma
 *   panelist) flagged record lock + e-signature as the second of two
 *   GMP blockers (the first was the audit trail in P1-04).
 *
 * What this module provides:
 *   - {@link LockState} — the per-record lock data shape, immutable.
 *   - {@link lockRecord} / {@link unlockRecord} — pure transitions that
 *     also produce a chained audit-log entry so the lock action is
 *     itself tamper-evident.
 *   - {@link requireUnlocked} — guard helper for command dispatchers; the
 *     caller is expected to throw or short-circuit on a non-null result.
 *   - {@link verifyLockSignature} — re-derives the lock signature from
 *     the audit log so a viewer can prove the on-disk lock state was
 *     produced by the corresponding SIGN entry.
 *
 * What this module is *not* (deferred to wave-5):
 *   - Real cryptographic identity. We do not yet manage per-user
 *     keypairs. The "signature" is the SHA-256 of (record id, actor,
 *     reason, timestamp, last audit hash) — strong tamper evidence,
 *     not non-repudiation.
 *   - User-facing modal. A minimal React modal lives in `@kendraw/ui`
 *     (P1-05 UI half) and is wired separately.
 *   - Network-side enforcement (server-trusted lock state).
 */

import {
  AUDIT_ACTIONS,
  canonicalHashInput,
  sha256Hex,
  type AuditEntry,
  type InMemoryAuditLog,
} from './audit-log.js';

/** Reason categories the e-sig modal lets the user pick from. */
export const SIGNATURE_MEANINGS = {
  APPROVED: 'approved',
  REVIEWED: 'reviewed',
  AUTHORED: 'authored',
  WITNESSED: 'witnessed',
} as const;

export type SignatureMeaning =
  | (typeof SIGNATURE_MEANINGS)[keyof typeof SIGNATURE_MEANINGS]
  | string;

/**
 * Immutable snapshot of a record's lock state. `null` everywhere means
 * "never locked"; once locked, the fields describe *who* locked it,
 * *when*, and *why*. Unlocking does not erase history — it sets
 * `locked: false` while leaving `lockedBy`/`lockedAt`/`reason`/
 * `signatureHash` for the auditor to read alongside the audit log.
 */
export interface LockState {
  locked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  reason: string | null;
  meaning: SignatureMeaning | null;
  /** Hash from the SIGN audit entry that produced this lock. */
  signatureHash: string | null;
}

export const UNLOCKED: LockState = Object.freeze({
  locked: false,
  lockedBy: null,
  lockedAt: null,
  reason: null,
  meaning: null,
  signatureHash: null,
});

export interface LockOptions {
  recordId: string;
  actor: string;
  reason: string;
  meaning: SignatureMeaning;
  /** Override timestamp for tests; production callers should omit. */
  timestamp?: string;
}

export interface UnlockOptions {
  recordId: string;
  actor: string;
  reason: string;
  timestamp?: string;
}

export interface LockTransitionResult {
  state: LockState;
  audit: AuditEntry;
}

/**
 * Lock a record. Appends a SIGN+LOCK pair to the audit log so the
 * signer's identity, the meaning, and the lock event are all chained.
 *
 * Throws if `state.locked` is already true — callers must explicitly
 * unlock-then-relock so that the intermediate UNLOCK entry exists for
 * auditors.
 */
export async function lockRecord(
  state: LockState,
  log: InMemoryAuditLog,
  opts: LockOptions,
): Promise<LockTransitionResult> {
  if (state.locked) {
    throw new Error(`record-lock: ${opts.recordId} is already locked — unlock first`);
  }
  if (opts.reason.trim().length < 3) {
    throw new Error('record-lock: reason must be at least 3 characters');
  }
  const audit = await log.append({
    actor: opts.actor,
    action: AUDIT_ACTIONS.SIGN,
    target: opts.recordId,
    reason: opts.reason,
    payload: { meaning: opts.meaning, transition: 'lock' },
    ...(opts.timestamp !== undefined ? { timestamp: opts.timestamp } : {}),
  });
  const newState: LockState = {
    locked: true,
    lockedBy: opts.actor,
    lockedAt: audit.timestamp,
    reason: opts.reason,
    meaning: opts.meaning,
    signatureHash: audit.hash,
  };
  return { state: newState, audit };
}

/**
 * Unlock a previously locked record. Like {@link lockRecord}, this
 * appends an UNLOCK audit entry and refuses if the record is not
 * currently locked.
 */
export async function unlockRecord(
  state: LockState,
  log: InMemoryAuditLog,
  opts: UnlockOptions,
): Promise<LockTransitionResult> {
  if (!state.locked) {
    throw new Error(`record-lock: ${opts.recordId} is not locked`);
  }
  if (opts.reason.trim().length < 3) {
    throw new Error('record-lock: reason must be at least 3 characters');
  }
  const audit = await log.append({
    actor: opts.actor,
    action: AUDIT_ACTIONS.UNLOCK,
    target: opts.recordId,
    reason: opts.reason,
    payload: { previousSignatureHash: state.signatureHash },
    ...(opts.timestamp !== undefined ? { timestamp: opts.timestamp } : {}),
  });
  // Keep the historical lock metadata visible alongside `locked: false`
  // so downstream UIs can show "last locked by Alice on 2026-04-17".
  const newState: LockState = {
    locked: false,
    lockedBy: state.lockedBy,
    lockedAt: state.lockedAt,
    reason: state.reason,
    meaning: state.meaning,
    signatureHash: state.signatureHash,
  };
  return { state: newState, audit };
}

/**
 * Guard helper — call before applying a mutation. Returns `null` if the
 * mutation may proceed, or a human-readable reason string when blocked.
 * Returning a value (rather than throwing) keeps the call sites readable
 * in conditional dispatch code.
 */
export function requireUnlocked(state: LockState, opts: { actor?: string } = {}): string | null {
  if (!state.locked) return null;
  if (opts.actor !== undefined && opts.actor === state.lockedBy) {
    // Same user holding the lock — they may still mutate while signed
    // in; they are responsible for re-signing afterwards. This mirrors
    // the ELN convention where the original author can revise pending
    // a witness countersign.
    return null;
  }
  return `record locked by ${state.lockedBy ?? '(unknown)'} — unlock with e-signature first`;
}

/**
 * Recompute the SHA-256 over the SIGN audit entry that produced
 * `state` and confirm it matches `state.signatureHash`. Used by viewers
 * to prove the lock has not been forged.
 */
export async function verifyLockSignature(
  state: LockState,
  signEntry: AuditEntry,
): Promise<boolean> {
  if (!state.locked && state.signatureHash === null) return true;
  if (state.signatureHash === null) return false;
  if (signEntry.hash !== state.signatureHash) return false;
  const recomputed = await sha256Hex(
    canonicalHashInput({
      seq: signEntry.seq,
      timestamp: signEntry.timestamp,
      actor: signEntry.actor,
      action: signEntry.action,
      target: signEntry.target,
      reason: signEntry.reason,
      payload: signEntry.payload,
      prevHash: signEntry.prevHash,
    }),
  );
  return recomputed === state.signatureHash;
}
