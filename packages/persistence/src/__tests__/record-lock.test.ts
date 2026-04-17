import { describe, it, expect } from 'vitest';
import { InMemoryAuditLog, AUDIT_ACTIONS, type AuditEntry } from '../audit-log.js';
import {
  UNLOCKED,
  lockRecord,
  unlockRecord,
  requireUnlocked,
  verifyLockSignature,
  SIGNATURE_MEANINGS,
  type LockState,
} from '../record-lock.js';

const FROZEN_TIME = '2026-04-17T12:00:00.000Z';

function freshLog() {
  return new InMemoryAuditLog(() => FROZEN_TIME);
}

describe('lockRecord', () => {
  it('locks an unlocked record and stamps the chain', async () => {
    const log = freshLog();
    const { state, audit } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'final review for batch 042',
      meaning: SIGNATURE_MEANINGS.APPROVED,
    });
    expect(state.locked).toBe(true);
    expect(state.lockedBy).toBe('alice');
    expect(state.signatureHash).toBe(audit.hash);
    expect(audit.action).toBe(AUDIT_ACTIONS.SIGN);
    expect(audit.reason).toBe('final review for batch 042');
  });

  it('refuses to lock an already-locked record', async () => {
    const log = freshLog();
    const { state } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'first lock',
      meaning: SIGNATURE_MEANINGS.AUTHORED,
    });
    await expect(
      lockRecord(state, log, {
        recordId: 'doc-1',
        actor: 'bob',
        reason: 'second lock',
        meaning: SIGNATURE_MEANINGS.WITNESSED,
      }),
    ).rejects.toThrow(/already locked/);
  });

  it('rejects empty or too-short reasons', async () => {
    const log = freshLog();
    await expect(
      lockRecord(UNLOCKED, log, {
        recordId: 'doc-1',
        actor: 'alice',
        reason: '  ',
        meaning: SIGNATURE_MEANINGS.APPROVED,
      }),
    ).rejects.toThrow(/at least 3 characters/);
  });
});

describe('unlockRecord', () => {
  it('flips locked → false but retains historical signature metadata', async () => {
    const log = freshLog();
    const locked = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'initial',
      meaning: SIGNATURE_MEANINGS.AUTHORED,
    });
    const unlocked = await unlockRecord(locked.state, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'reopen for revision',
    });
    expect(unlocked.state.locked).toBe(false);
    // History fields are preserved so the UI can render "last locked by …".
    expect(unlocked.state.lockedBy).toBe('alice');
    expect(unlocked.state.signatureHash).toBe(locked.state.signatureHash);
    expect(unlocked.audit.action).toBe(AUDIT_ACTIONS.UNLOCK);
  });

  it('refuses to unlock a record that is not locked', async () => {
    const log = freshLog();
    await expect(
      unlockRecord(UNLOCKED, log, {
        recordId: 'doc-1',
        actor: 'alice',
        reason: 'reopen',
      }),
    ).rejects.toThrow(/not locked/);
  });
});

describe('requireUnlocked', () => {
  it('returns null for an unlocked record (mutation allowed)', () => {
    expect(requireUnlocked(UNLOCKED)).toBeNull();
  });

  it('returns a human reason when locked by another user', async () => {
    const log = freshLog();
    const { state } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'review complete',
      meaning: SIGNATURE_MEANINGS.APPROVED,
    });
    const blocked = requireUnlocked(state, { actor: 'bob' });
    expect(blocked).toMatch(/locked by alice/);
  });

  it('allows the lock-holder to mutate without unlocking (revision pattern)', async () => {
    const log = freshLog();
    const { state } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'initial sign',
      meaning: SIGNATURE_MEANINGS.AUTHORED,
    });
    expect(requireUnlocked(state, { actor: 'alice' })).toBeNull();
  });

  it('blocks anonymous mutation when no actor is provided', async () => {
    const log = freshLog();
    const { state } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'sign',
      meaning: SIGNATURE_MEANINGS.APPROVED,
    });
    expect(requireUnlocked(state)).toMatch(/locked by alice/);
  });
});

describe('verifyLockSignature', () => {
  it('confirms a clean lock chain', async () => {
    const log = freshLog();
    const { state, audit } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'sign',
      meaning: SIGNATURE_MEANINGS.APPROVED,
    });
    expect(await verifyLockSignature(state, audit)).toBe(true);
  });

  it('detects a tampered SIGN entry (reason mutated post-hoc)', async () => {
    const log = freshLog();
    const { state, audit } = await lockRecord(UNLOCKED, log, {
      recordId: 'doc-1',
      actor: 'alice',
      reason: 'genuine reason',
      meaning: SIGNATURE_MEANINGS.APPROVED,
    });
    // Mutate the reason but keep the hash field — the recompute step
    // catches it: re-hashing the new contents yields a value that does
    // not match the (frozen) state.signatureHash.
    const reasonForged: AuditEntry = { ...audit, reason: 'fake reason' };
    expect(await verifyLockSignature(state, reasonForged)).toBe(false);

    // Mutate the hash itself — the cheap pre-check fails immediately.
    const hashForged: AuditEntry = { ...audit, hash: 'deadbeef' };
    expect(await verifyLockSignature(state, hashForged)).toBe(false);

    // Sanity: the genuine entry still verifies.
    expect(await verifyLockSignature(state, audit)).toBe(true);
  });

  it('returns true for a never-locked state', async () => {
    expect(
      await verifyLockSignature(UNLOCKED, {
        seq: 0,
        timestamp: FROZEN_TIME,
        actor: '',
        action: '',
        target: null,
        reason: null,
        payload: null,
        prevHash: '',
        hash: '',
      }),
    ).toBe(true);
  });

  it('returns false when state claims to be locked but signatureHash is null', async () => {
    const broken: LockState = {
      locked: true,
      lockedBy: 'alice',
      lockedAt: FROZEN_TIME,
      reason: 'r',
      meaning: SIGNATURE_MEANINGS.APPROVED,
      signatureHash: null,
    };
    const dummy: AuditEntry = {
      seq: 1,
      timestamp: FROZEN_TIME,
      actor: 'alice',
      action: AUDIT_ACTIONS.SIGN,
      target: 'doc-1',
      reason: 'r',
      payload: null,
      prevHash: '',
      hash: 'whatever',
    };
    expect(await verifyLockSignature(broken, dummy)).toBe(false);
  });
});
