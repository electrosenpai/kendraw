import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { RecoveryBanner } from '../RecoveryBanner';

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

describe('RecoveryBanner', () => {
  it('renders singular label for one restored session', () => {
    act(() => {
      root.render(<RecoveryBanner count={1} onKeep={() => {}} onDiscard={() => {}} />);
    });
    expect(container.textContent).toContain('Recovered 1 previous session');
  });

  it('renders plural label for multiple sessions', () => {
    act(() => {
      root.render(<RecoveryBanner count={3} onKeep={() => {}} onDiscard={() => {}} />);
    });
    expect(container.textContent).toContain('Recovered 3 previous sessions');
  });

  it('invokes onKeep when Keep is clicked', () => {
    const onKeep = vi.fn();
    act(() => {
      root.render(<RecoveryBanner count={2} onKeep={onKeep} onDiscard={() => {}} />);
    });
    const keepBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="recovery-keep"]',
    );
    expect(keepBtn).not.toBeNull();
    act(() => {
      keepBtn?.click();
    });
    expect(onKeep).toHaveBeenCalledOnce();
  });

  it('invokes onDiscard when Discard is clicked', () => {
    const onDiscard = vi.fn();
    act(() => {
      root.render(<RecoveryBanner count={2} onKeep={() => {}} onDiscard={onDiscard} />);
    });
    const discardBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="recovery-discard"]',
    );
    expect(discardBtn).not.toBeNull();
    act(() => {
      discardBtn?.click();
    });
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('uses data-testid="recovery-banner" on the root element', () => {
    act(() => {
      root.render(<RecoveryBanner count={1} onKeep={() => {}} onDiscard={() => {}} />);
    });
    expect(container.querySelector('[data-testid="recovery-banner"]')).not.toBeNull();
  });
});
