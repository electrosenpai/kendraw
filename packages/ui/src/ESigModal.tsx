import { useState, useId, type FormEvent } from 'react';
import { SIGNATURE_MEANINGS, type SignatureMeaning } from '@kendraw/persistence';

/**
 * E-signature modal — Wave-4 P1-05 (Beta).
 *
 * Collects the three pieces of information required for a 21 CFR Part 11
 * §11.50-style "manifestation": *who* is signing, *what the signature
 * means*, and *why this change is being recorded*. The actual lock
 * transition + audit-log entry are produced by the caller via
 * `lockRecord(state, log, …)`; this component is purely the UI shell.
 *
 * Design notes:
 *  - We do not collect a password here. Real auth is the deployment's
 *    job (SSO, OIDC, …); this modal trusts the caller's already-signed-in
 *    actor and only asks for re-confirmation + intent.
 *  - The Reason field is mandatory (≥3 chars, matching the persistence
 *    layer's validation) and the submit button is disabled until valid.
 *    The persistence layer also re-validates so the UI cannot bypass.
 *  - Submit fires `onSign({ actor, reason, meaning })`; the host wraps
 *    `lockRecord` and handles errors (e.g. "already locked").
 */

export interface ESigModalProps {
  open: boolean;
  defaultActor: string;
  recordLabel: string;
  onSign: (args: { actor: string; reason: string; meaning: SignatureMeaning }) => void;
  onCancel: () => void;
  /** Optional override for the meanings dropdown order/labels. */
  meanings?: { value: SignatureMeaning; label: string }[];
}

const DEFAULT_MEANINGS: { value: SignatureMeaning; label: string }[] = [
  { value: SIGNATURE_MEANINGS.APPROVED, label: 'Approved' },
  { value: SIGNATURE_MEANINGS.REVIEWED, label: 'Reviewed' },
  { value: SIGNATURE_MEANINGS.AUTHORED, label: 'Authored' },
  { value: SIGNATURE_MEANINGS.WITNESSED, label: 'Witnessed' },
];

export function ESigModal(props: ESigModalProps) {
  const { open, defaultActor, recordLabel, onSign, onCancel } = props;
  const meanings = props.meanings ?? DEFAULT_MEANINGS;
  const reasonId = useId();
  const actorId = useId();
  const meaningId = useId();
  const [actor, setActor] = useState(defaultActor);
  const [reason, setReason] = useState('');
  const [meaning, setMeaning] = useState<SignatureMeaning>(
    meanings[0]?.value ?? SIGNATURE_MEANINGS.APPROVED,
  );
  if (!open) return null;

  const trimmedReason = reason.trim();
  const valid = trimmedReason.length >= 3 && actor.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSign({ actor: actor.trim(), reason: trimmedReason, meaning });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${reasonId}-title`}
      data-testid="esig-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--kd-color-surface, #1a1a1a)',
          color: 'var(--kd-color-text, #eaeaea)',
          padding: 20,
          borderRadius: 8,
          minWidth: 360,
          maxWidth: 480,
          border: '1px solid var(--kd-color-border, #333)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h2
          id={`${reasonId}-title`}
          style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}
        >
          Electronic signature
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#aaa' }}>
          You are about to lock <strong>{recordLabel}</strong>. Locking creates
          a tamper-evident audit entry that cannot be deleted. Provide the
          meaning of your signature and a short reason.
        </p>

        <label
          htmlFor={actorId}
          style={{ display: 'block', fontSize: 11, marginBottom: 4, color: '#888' }}
        >
          Signing as
        </label>
        <input
          id={actorId}
          type="text"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          data-testid="esig-actor"
          style={inputStyle}
        />

        <label
          htmlFor={meaningId}
          style={{
            display: 'block',
            fontSize: 11,
            marginBottom: 4,
            marginTop: 12,
            color: '#888',
          }}
        >
          Signature meaning
        </label>
        <select
          id={meaningId}
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          data-testid="esig-meaning"
          style={inputStyle}
        >
          {meanings.map((m) => (
            <option key={String(m.value)} value={String(m.value)}>
              {m.label}
            </option>
          ))}
        </select>

        <label
          htmlFor={reasonId}
          style={{
            display: 'block',
            fontSize: 11,
            marginBottom: 4,
            marginTop: 12,
            color: '#888',
          }}
        >
          Reason for signing (≥ 3 characters, required)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          data-testid="esig-reason"
          style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            type="button"
            onClick={onCancel}
            data-testid="esig-cancel"
            style={{ ...buttonStyle, background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            data-testid="esig-submit"
            style={{
              ...buttonStyle,
              background: valid ? 'var(--kd-color-accent, #4dabf7)' : '#444',
              color: valid ? '#fff' : '#888',
              cursor: valid ? 'pointer' : 'not-allowed',
            }}
          >
            Sign &amp; lock
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  fontSize: 13,
  background: '#0e0e0e',
  color: 'inherit',
  border: '1px solid #333',
  borderRadius: 4,
  fontFamily: 'inherit',
};

const buttonStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  border: '1px solid #333',
  borderRadius: 4,
  fontFamily: 'inherit',
};
