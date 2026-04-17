/**
 * Single-source-of-truth gate for global hotkeys. Mirrors
 * packages/ui/src/hooks/useIsEditingText.ts — kept in sync so nmr
 * does not need to depend on @kendraw/ui.
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
