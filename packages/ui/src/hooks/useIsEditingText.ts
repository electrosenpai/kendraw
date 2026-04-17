import { useEffect, useState } from 'react';

/**
 * Text-ish input types that should behave as text editors for the purposes
 * of global hotkey gating. Password and number are included because users
 * routinely type letters into them and we do not want a `c` keystroke to
 * fire an atom hotkey while they do.
 *
 * Empty string is HTML's default for `<input>` (treated as "text").
 */
const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  '',
]);

/**
 * Synchronous check: is the currently focused DOM element a text input?
 *
 * Returns true for:
 *   - <input> with a text-like type
 *   - <textarea>
 *   - any element with contentEditable="true"
 *   - any element with the explicit opt-in attribute `data-text-editing="true"`
 *
 * Always safe to call from event handlers — it queries `document.activeElement`
 * at call time, so it sees the same focus state the browser would route the
 * keystroke to.
 *
 * SSR-safe: returns false if `document` is not available.
 */
export function isEditingTextNow(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.getAttribute?.('data-text-editing') === 'true') return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || '').toLowerCase();
    return TEXT_INPUT_TYPES.has(type);
  }
  if (el.isContentEditable) return true;
  return false;
}

/**
 * React hook that subscribes to focus changes and returns whether a text
 * input currently has focus. Uses focusin/focusout on document so it picks
 * up focus changes happening anywhere in the tree, including inside portals.
 */
export function useIsEditingText(): boolean {
  const [editing, setEditing] = useState<boolean>(() => isEditingTextNow());
  useEffect(() => {
    const check = () => setEditing(isEditingTextNow());
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    check();
    return () => {
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
    };
  }, []);
  return editing;
}
