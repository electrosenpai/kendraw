// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher
//
// Thin React wrapper around ketcher-react's <Editor/>. Renders Ketcher in
// standalone mode (Indigo WASM, no backend), captures the instance on
// onInit, and forwards change + selectionChange events into the Kendraw
// ketcher bridge. Panels (PropertyPanel, NmrPanel) observe the bridge and
// do not talk to Ketcher directly.

import { useEffect, useRef } from 'react';
import { Editor } from 'ketcher-react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import type { Ketcher } from 'ketcher-core';
import 'ketcher-react/dist/index.css';
import {
  resetKetcherBridge,
  setKetcherInstance,
  setKetcherMolfile,
  setKetcherSelection,
} from './ketcherBridge';

const structServiceProvider = new StandaloneStructServiceProvider();

function formatKetcherError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown Ketcher error';
  }
}

export function KetcherCanvas(): React.ReactElement {
  const ketcherRef = useRef<Ketcher | null>(null);
  const suppressSelectionEventRef = useRef(false);

  useEffect(() => {
    return () => {
      ketcherRef.current = null;
      resetKetcherBridge();
    };
  }, []);

  return (
    <div
      data-testid="ketcher-canvas-root"
      className="ketcher-canvas-host"
      style={{ width: '100%', height: '100%' }}
    >
      <Editor
        staticResourcesUrl=""
        structServiceProvider={structServiceProvider}
        errorHandler={(err) => {
          // Surface Ketcher errors without crashing the Kendraw shell.
          console.error('[Ketcher]', formatKetcherError(err));
        }}
        onInit={(ketcher: Ketcher) => {
          ketcherRef.current = ketcher;
          setKetcherInstance(ketcher);

          // Molecule changes: pull the current molfile and publish it.
          // `change` fires with structured ChangeEventData[] but Kendraw
          // only needs the serialized molfile.
          ketcher.editor.subscribe('change', async () => {
            try {
              const mol = await ketcher.getMolfile();
              setKetcherMolfile(mol);
            } catch (err) {
              console.error('[Ketcher] getMolfile failed', formatKetcherError(err));
            }
          });

          // Selection changes: fires with `undefined` when the user clears
          // the selection, so guard the payload. Also fires when we set
          // the selection programmatically — skip those to avoid feedback
          // loops when the NMR panel drives selection.
          ketcher.editor.subscribe('selectionChange', (payload: unknown) => {
            if (suppressSelectionEventRef.current) return;
            const selection = payload as { atoms?: readonly number[] } | undefined;
            setKetcherSelection(selection?.atoms ?? []);
          });
        }}
      />
    </div>
  );
}

export function setKetcherSelectionFromPanel(
  ketcher: Ketcher,
  atoms: readonly number[],
): void {
  // When the NMR panel drives selection, Ketcher's `selectionChange`
  // subscription will fire for the programmatic write too. Consumers of
  // this helper should toggle a suppression flag around the call if they
  // are also listening.
  ketcher.editor.selection({ atoms: atoms.length === 0 ? [] : [...atoms] });
}
