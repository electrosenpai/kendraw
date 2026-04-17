export { KendrawDB, type StoredDocument } from './db.js';
export { AutoSaveScheduler } from './auto-save.js';
export {
  AUDIT_ACTIONS,
  InMemoryAuditLog,
  verifyAuditChain,
  canonicalHashInput,
  stableStringify,
  sha256Hex,
  type AuditAction,
  type AuditAppendInput,
  type AuditEntry,
  type VerifyResult,
} from './audit-log.js';
export {
  SIGNATURE_MEANINGS,
  UNLOCKED,
  lockRecord,
  unlockRecord,
  requireUnlocked,
  verifyLockSignature,
  type LockState,
  type LockOptions,
  type UnlockOptions,
  type LockTransitionResult,
  type SignatureMeaning,
} from './record-lock.js';
