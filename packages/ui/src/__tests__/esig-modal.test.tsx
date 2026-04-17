import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ESigModal } from '../ESigModal';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function renderModal(overrides: Partial<Parameters<typeof ESigModal>[0]> = {}) {
  const onSign = vi.fn();
  const onCancel = vi.fn();
  act(() => {
    root.render(
      <ESigModal
        open
        defaultActor="alice"
        recordLabel="page-1"
        onSign={onSign}
        onCancel={onCancel}
        {...overrides}
      />,
    );
  });
  return { onSign, onCancel };
}

function setInput(testId: string, value: string) {
  const el = document.body.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[data-testid="${testId}"]`,
  );
  if (!el) throw new Error(`element ${testId} not found`);
  const setter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ESigModal', () => {
  it('does not render anything when open=false', () => {
    act(() => {
      root.render(
        <ESigModal
          open={false}
          defaultActor="alice"
          recordLabel="x"
          onSign={() => {}}
          onCancel={() => {}}
        />,
      );
    });
    expect(document.body.querySelector('[data-testid="esig-modal"]')).toBeNull();
  });

  it('renders the record label so the user knows what they are locking', () => {
    renderModal();
    const dialog = document.body.querySelector('[data-testid="esig-modal"]');
    expect(dialog?.textContent).toContain('page-1');
  });

  it('disables submit until reason is at least 3 characters', () => {
    renderModal();
    const submit = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="esig-submit"]',
    );
    expect(submit?.disabled).toBe(true);
    act(() => {
      setInput('esig-reason', 'ab');
    });
    expect(submit?.disabled).toBe(true);
    act(() => {
      setInput('esig-reason', 'review complete');
    });
    expect(submit?.disabled).toBe(false);
  });

  it('passes trimmed reason and selected meaning to onSign', () => {
    const { onSign } = renderModal();
    act(() => {
      setInput('esig-reason', '   final approval   ');
    });
    const form = document.body.querySelector('form');
    act(() => {
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    expect(onSign).toHaveBeenCalledTimes(1);
    expect(onSign).toHaveBeenCalledWith({
      actor: 'alice',
      reason: 'final approval',
      meaning: 'approved',
    });
  });

  it('invokes onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderModal();
    const cancel = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="esig-cancel"]',
    );
    act(() => {
      cancel?.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('refuses to submit when the actor is empty even if reason is valid', () => {
    const { onSign } = renderModal();
    act(() => {
      setInput('esig-actor', '');
      setInput('esig-reason', 'looks fine');
    });
    const submit = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="esig-submit"]',
    );
    expect(submit?.disabled).toBe(true);
    expect(onSign).not.toHaveBeenCalled();
  });
});
