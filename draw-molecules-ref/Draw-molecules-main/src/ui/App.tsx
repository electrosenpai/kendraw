import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { refineDocumentWithConstraints, validateAtomElementChange } from '../chem/constraints';
import {
  createEditorSnapshot,
  cloneSnapshot,
  createEmptyDocument,
  removeEntity,
} from '../chem/document';
import { DEFAULT_NMR_SOLVENT, createEmptyNmrPrediction } from '../chem/nmr-shared';
import {
  createExampleDocument,
  calculateChemicalInsights,
  cleanUpDocument,
  exportSvg,
  importStructure,
} from '../chem/ocl';
import {
  buildProtonDisplayModel,
  normalizeProtonAtomKey,
  type ProtonOverlayLabel,
} from '../chem/proton-numbering';
import { createAnalyticalJsonExport, createSpectrumCsvExport } from '../chem/analysis-export';
import { createAnalyticalReportHtml } from '../chem/report';
import { bondTypeFromShortcut, elementFromKeyBuffer, toolFromShortcut } from '../editor/tools';
import { useEditorStore } from '../editor/useEditorStore';
import type {
  ChemicalDocument,
  EditorSettings,
  NmrPredictionResult,
  NmrSignal,
  NmrSignalFocus,
  NmrSolventId,
} from '../chem/types';
import { DataExportDialog } from './DataExportDialog';
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas';
import { InfoPanel } from './InfoPanel';
import { MenuBar } from './MenuBar';
import { ReportPreviewDialog } from './ReportPreviewDialog';
import { StyleBar } from './StyleBar';
import { ToolPalette } from './ToolPalette';

const STARTER_DOCUMENT = createExampleDocument('CC(=O)Oc1ccccc1C(=O)O', 'Aspirin');
let nmrEnginePromise: Promise<typeof import('../chem/nmr')> | null = null;

function loadNmrEngine() {
  nmrEnginePromise ??= import('../chem/nmr');
  return nmrEnginePromise;
}

export function App() {
  const editor = useEditorStore(createEditorSnapshot(STARTER_DOCUMENT));
  const deferredDocument = useDeferredValue(editor.snapshot.document);
  const insights = calculateChemicalInsights(deferredDocument);
  const canvasRef = useRef<EditorCanvasHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const keyBufferRef = useRef('');
  const keyTimerRef = useRef<number | null>(null);
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(null);
  const [importDraft, setImportDraft] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [nmrPrediction, setNmrPrediction] = useState<NmrPredictionResult>(
    createEmptyNmrPrediction(),
  );
  const [nmrSolvent, setNmrSolvent] = useState<NmrSolventId>(DEFAULT_NMR_SOLVENT);
  const [protonOverlayLabels, setProtonOverlayLabels] = useState<ProtonOverlayLabel[]>([]);
  const [selectedNmrSignal, setSelectedNmrSignal] = useState<NmrSignalFocus | null>(null);
  const [hoveredNmrSignal, setHoveredNmrSignal] = useState<NmrSignalFocus | null>(null);
  const [isDataExportOpen, setIsDataExportOpen] = useState(false);
  const [reportPreview, setReportPreview] = useState<{
    html: string;
    filename: string;
    title: string;
  } | null>(null);

  function updateSettings(next: Partial<EditorSettings>) {
    editor.patch((draft) => {
      draft.settings = { ...draft.settings, ...next };
    });
  }

  function refineCurrentDocument() {
    startTransition(() => {
      const result = refineDocumentWithConstraints(editor.snapshot.document, {
        bondLength: editor.snapshot.settings.bondLength,
      });
      const nextSnapshot = cloneSnapshot(editor.snapshot);
      nextSnapshot.document = result.document;
      nextSnapshot.selectionIds = [];
      nextSnapshot.statusText = result.statusText;
      editor.commit('Refine Structure', editor.snapshot, nextSnapshot);
    });
  }

  function downloadText(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function handleOpenFile(documentText: string, filename: string) {
    try {
      const parsed = JSON.parse(documentText) as ChemicalDocument;
      if (parsed.page?.atoms && parsed.page?.bonds) {
        editor.reset(createEditorSnapshot(parsed));
        return;
      }
    } catch {
      // Ignore JSON parse failure and fall through to structure parsing.
    }

    const imported = importStructure(
      documentText,
      filename.replace(/\.[^.]+$/, '') || 'Imported Structure',
    );
    if (imported) {
      editor.reset(createEditorSnapshot(imported));
      return;
    }

    window.alert(
      'This file could not be parsed as a ChemCanvas JSON document or supported structure text.',
    );
  }

  function buildAnalyticalReportAsset() {
    const document = editor.snapshot.document;
    const title = document.name || 'Untitled Structure';
    return {
      title,
      filename: `${title.replace(/\s+/g, '_').toLowerCase() || 'structure'}.analysis-report.html`,
      html: createAnalyticalReportHtml({
        document,
        insights: calculateChemicalInsights(document),
        prediction: nmrPrediction,
        solvent: nmrSolvent,
      }),
    };
  }

  function exportBaseName(documentName: string) {
    return documentName.replace(/\s+/g, '_').toLowerCase() || 'structure';
  }

  function buildAnalysisDataAssets() {
    const document = editor.snapshot.document;
    const title = document.name || 'Untitled Structure';
    const baseName = exportBaseName(title);
    const liveInsights = calculateChemicalInsights(document);

    return {
      json: {
        filename: `${baseName}.analysis.json`,
        content: createAnalyticalJsonExport({
          document,
          insights: liveInsights,
          prediction: nmrPrediction,
          solvent: nmrSolvent,
        }),
      },
      protonCsv: {
        filename: `${baseName}.1h-nmr.csv`,
        content: createSpectrumCsvExport({
          document,
          spectrum: nmrPrediction.proton,
        }),
      },
      carbonCsv: {
        filename: `${baseName}.13c-nmr.csv`,
        content: createSpectrumCsvExport({
          document,
          spectrum: nmrPrediction.carbon,
        }),
      },
    };
  }

  function deleteSelection() {
    if (editor.snapshot.selectionIds.length === 0) {
      return;
    }

    editor.execute('Delete Selection', (draft) => {
      for (const selectionId of draft.selectionIds) {
        removeEntity(draft.document, selectionId);
      }
      draft.selectionIds = [];
    });
  }

  function applyElementShortcut(element: string) {
    if (editor.snapshot.selectionIds.length === 0) {
      return;
    }

    const before = cloneSnapshot(editor.snapshot);
    const after = cloneSnapshot(editor.snapshot);

    for (const selectionId of after.selectionIds) {
      const atom = after.document.page.atoms.find((entry) => entry.id === selectionId);
      if (!atom) {
        continue;
      }

      const validation = validateAtomElementChange(after.document, atom.id, element);
      if (!validation.ok) {
        editor.patch((draft) => {
          draft.statusText = validation.statusText;
        });
        return;
      }

      atom.element = element;
      after.statusText = validation.statusText;
    }

    editor.commit(`Set element to ${element}`, before, after);
  }

  function applyCurrentColor() {
    const color = editor.snapshot.settings.singleColor;
    const hasSelection = editor.snapshot.selectionIds.length > 0;

    editor.execute(
      hasSelection ? 'Apply Color to Selection' : 'Apply Color to Document',
      (draft) => {
        const targets = hasSelection
          ? new Set(draft.selectionIds)
          : new Set([
              ...draft.document.page.atoms.map((atom) => atom.id),
              ...draft.document.page.bonds.map((bond) => bond.id),
              ...draft.document.page.texts.map((text) => text.id),
              ...draft.document.page.arrows.map((arrow) => arrow.id),
            ]);

        for (const atom of draft.document.page.atoms) {
          if (targets.has(atom.id)) {
            atom.color = color;
          }
        }
        for (const bond of draft.document.page.bonds) {
          if (targets.has(bond.id)) {
            bond.color = color;
          }
        }
        for (const text of draft.document.page.texts) {
          if (targets.has(text.id)) {
            text.color = color;
          }
        }
        for (const arrow of draft.document.page.arrows) {
          if (targets.has(arrow.id)) {
            arrow.color = color;
          }
        }
      },
    );
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        editor.redo();
      } else {
        editor.undo();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      editor.redo();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      downloadText(
        `${editor.snapshot.document.name.replace(/\s+/g, '_').toLowerCase() || 'structure'}.chemcanvas.json`,
        JSON.stringify(editor.snapshot.document, null, 2),
        'application/json',
      );
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      fileInputRef.current?.click();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && event.shiftKey) {
      event.preventDefault();
      navigator.clipboard.writeText(insights.smiles || '');
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      editor.patch((draft) => {
        draft.viewport.showCarbonLabels = !draft.viewport.showCarbonLabels;
      });
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      startTransition(() => {
        const cleaned = cleanUpDocument(editor.snapshot.document);
        editor.reset(createEditorSnapshot(cleaned));
      });
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      refineCurrentDocument();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteSelection();
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      editor.execute('Increase atom charge', (draft) => {
        for (const selectionId of draft.selectionIds) {
          const atom = draft.document.page.atoms.find((entry) => entry.id === selectionId);
          if (atom) {
            atom.charge += 1;
          }
        }
      });
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      editor.execute('Decrease atom charge', (draft) => {
        for (const selectionId of draft.selectionIds) {
          const atom = draft.document.page.atoms.find((entry) => entry.id === selectionId);
          if (atom) {
            atom.charge -= 1;
          }
        }
      });
      return;
    }

    const bondShortcut = bondTypeFromShortcut(event.key);
    if (bondShortcut) {
      editor.patch((draft) => {
        draft.activeTool = 'bond';
        draft.activeBondType = bondShortcut;
      });
      return;
    }

    const toolShortcut = toolFromShortcut(event.key);
    if (toolShortcut) {
      event.preventDefault();
      editor.patch((draft) => {
        draft.activeTool = toolShortcut;
      });
      return;
    }

    if (/^[a-zA-Z]$/.test(event.key)) {
      keyBufferRef.current = `${keyBufferRef.current}${event.key}`.slice(-2);
      const element = elementFromKeyBuffer(keyBufferRef.current);
      if (element) {
        if (editor.snapshot.selectionIds.length > 0) {
          applyElementShortcut(element);
        } else {
          editor.patch((draft) => {
            draft.activeElement = element;
            draft.activeTool = 'atom';
          });
        }
      }
      if (keyTimerRef.current) {
        window.clearTimeout(keyTimerRef.current);
      }
      keyTimerRef.current = window.setTimeout(() => {
        keyBufferRef.current = '';
      }, 500);
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (keyTimerRef.current) {
        window.clearTimeout(keyTimerRef.current);
      }
    };
  }, [onKeyDown]);

  useEffect(() => {
    let isCancelled = false;

    if (deferredDocument.page.atoms.length === 0) {
      setNmrPrediction(createEmptyNmrPrediction());
      return () => {
        isCancelled = true;
      };
    }

    setNmrPrediction((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    const timeoutId = window.setTimeout(() => {
      void loadNmrEngine()
        .then(({ predictNmrSpectra }) =>
          predictNmrSpectra(deferredDocument, { solvent: nmrSolvent }),
        )
        .then((prediction) => {
          if (!isCancelled) {
            setNmrPrediction(prediction);
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            setNmrPrediction({
              status: 'error',
              proton: null,
              carbon: null,
              warnings: [],
              error: error instanceof Error ? error.message : String(error),
              updatedAt: new Date().toISOString(),
            });
          }
        });
    }, 260);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredDocument, nmrSolvent]);

  useEffect(() => {
    if (deferredDocument.page.atoms.length === 0) {
      setProtonOverlayLabels([]);
      return;
    }

    try {
      setProtonOverlayLabels(buildProtonDisplayModel(deferredDocument).overlayLabels);
    } catch (error) {
      console.warn('Proton numbering could not be generated for the current structure.', error);
      setProtonOverlayLabels([]);
    }
  }, [deferredDocument]);

  useLayoutEffect(() => {
    const reconciledSelectedSignal = reconcileSignalFocus(selectedNmrSignal, nmrPrediction);
    if (!signalFocusEquals(selectedNmrSignal, reconciledSelectedSignal)) {
      setSelectedNmrSignal(reconciledSelectedSignal);
    }

    const reconciledHoveredSignal = reconcileSignalFocus(hoveredNmrSignal, nmrPrediction);
    if (!signalFocusEquals(hoveredNmrSignal, reconciledHoveredSignal)) {
      setHoveredNmrSignal(reconciledHoveredSignal);
    }
  }, [hoveredNmrSignal, nmrPrediction, selectedNmrSignal]);

  const selectedCanvasAtomIds = resolveCanvasAtomIds(
    selectedNmrSignal,
    deferredDocument,
    protonOverlayLabels,
  );
  const hoveredCanvasAtomIds = resolveCanvasAtomIds(
    hoveredNmrSignal,
    deferredDocument,
    protonOverlayLabels,
  );
  const selectedProtonAtomIds =
    selectedNmrSignal?.nucleus === '1H' ? selectedNmrSignal.atomIds : [];
  const hoveredProtonAtomIds = hoveredNmrSignal?.nucleus === '1H' ? hoveredNmrSignal.atomIds : [];

  return (
    <div className="app-shell">
      <MenuBar
        documentName={editor.snapshot.document.name}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onNew={() => editor.reset(createEditorSnapshot(createEmptyDocument()))}
        onOpen={() => fileInputRef.current?.click()}
        onSave={() =>
          downloadText(
            `${editor.snapshot.document.name.replace(/\s+/g, '_').toLowerCase() || 'structure'}.chemcanvas.json`,
            JSON.stringify(editor.snapshot.document, null, 2),
            'application/json',
          )
        }
        onUndo={editor.undo}
        onRedo={editor.redo}
        onImportText={() => {
          setImportDraft('');
          setIsImportOpen(true);
        }}
        onCopySmiles={() => navigator.clipboard.writeText(insights.smiles || '')}
        onRefine={refineCurrentDocument}
        onCleanUp={() =>
          startTransition(() => {
            const cleaned = cleanUpDocument(editor.snapshot.document);
            const nextSnapshot = cloneSnapshot(editor.snapshot);
            nextSnapshot.document = cleaned;
            nextSnapshot.selectionIds = [];
            editor.commit('Clean Up Structure', editor.snapshot, nextSnapshot);
          })
        }
        onOpenDataExport={() => setIsDataExportOpen(true)}
        onPreviewReport={() => {
          setReportPreview(buildAnalyticalReportAsset());
        }}
        onExportReport={() =>
          (() => {
            const reportAsset = buildAnalyticalReportAsset();
            downloadText(reportAsset.filename, reportAsset.html, 'text/html;charset=utf-8');
          })()
        }
        onExportSvg={() =>
          downloadText(
            `${editor.snapshot.document.name.replace(/\s+/g, '_').toLowerCase() || 'structure'}.svg`,
            exportSvg(editor.snapshot.document),
            'image/svg+xml',
          )
        }
        onExportPng={() => canvasRef.current?.exportPng(editor.snapshot.document.name)}
        onLoadExample={(smiles, label) =>
          startTransition(() => {
            editor.reset(createEditorSnapshot(createExampleDocument(smiles, label)));
          })
        }
      />

      <StyleBar
        settings={editor.snapshot.settings}
        activeBondType={editor.snapshot.activeBondType}
        activeRingTemplate={editor.snapshot.activeRingTemplate}
        selectedCount={editor.snapshot.selectionIds.length}
        onSettingsChange={updateSettings}
        onBondTypeChange={(type) =>
          editor.patch((draft) => {
            draft.activeBondType = type;
            draft.activeTool = 'bond';
          })
        }
        onRingTemplateChange={(template) =>
          editor.patch((draft) => {
            draft.activeRingTemplate = template;
            draft.activeTool = 'ring';
          })
        }
        onApplyColor={applyCurrentColor}
        onRefine={refineCurrentDocument}
      />

      <div className="workspace-shell">
        <ToolPalette
          activeTool={editor.snapshot.activeTool}
          activeElement={editor.snapshot.activeElement}
          activeBondType={editor.snapshot.activeBondType}
          activeRingTemplate={editor.snapshot.activeRingTemplate}
          onToolChange={(tool) => editor.patch((draft) => void (draft.activeTool = tool))}
          onElementChange={(element) =>
            editor.patch((draft) => {
              draft.activeElement = element;
            })
          }
          onBondTypeChange={(type) => editor.patch((draft) => void (draft.activeBondType = type))}
          onRingChange={(template) =>
            editor.patch((draft) => void (draft.activeRingTemplate = template))
          }
        />

        <main className="editor-panel">
          <EditorCanvas
            ref={canvasRef}
            snapshot={editor.snapshot}
            protonOverlayLabels={protonOverlayLabels}
            selectedCanvasAtomIds={selectedCanvasAtomIds}
            hoveredCanvasAtomIds={hoveredCanvasAtomIds}
            selectedProtonAtomIds={selectedProtonAtomIds}
            hoveredProtonAtomIds={hoveredProtonAtomIds}
            onProtonOverlayHover={(atomIds) => {
              setHoveredNmrSignal(atomIds ? findProtonSignalFocus(atomIds, nmrPrediction) : null);
            }}
            onProtonOverlaySelect={(atomIds) => {
              const signal = findProtonSignalFocus(atomIds, nmrPrediction);
              setSelectedNmrSignal((current) => toggleSignalSelection(current, signal));
            }}
            onPatch={editor.patch}
            onCommit={editor.commit}
            onExecute={editor.execute}
            onCursorChange={setCursorPoint}
          />
        </main>

        <InfoPanel
          insights={insights}
          selectionCount={editor.snapshot.selectionIds.length}
          nmrPrediction={nmrPrediction}
          nmrSolvent={nmrSolvent}
          selectedNmrSignal={selectedNmrSignal}
          hoveredNmrSignal={hoveredNmrSignal}
          onNmrSignalHover={setHoveredNmrSignal}
          onNmrSignalSelect={(signal) => {
            setSelectedNmrSignal((current) => toggleSignalSelection(current, signal));
          }}
          onNmrSolventChange={setNmrSolvent}
        />
      </div>

      <footer className="status-bar">
        <span>
          Cursor{' '}
          {cursorPoint ? `${cursorPoint.x.toFixed(1)} pt, ${cursorPoint.y.toFixed(1)} pt` : '—'}
        </span>
        <span>
          Formula {insights.formula} · MW{' '}
          {insights.averageMass ? insights.averageMass.toFixed(4) : '—'}
        </span>
        <span>
          Zoom {(editor.snapshot.viewport.zoom * 100).toFixed(0)}% · Tool{' '}
          {editor.snapshot.activeTool}
        </span>
        <span>{editor.snapshot.statusText}</span>
      </footer>

      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept=".json,.mol,.smi,.smiles,.txt,.cdxml"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          const text = await file.text();
          handleOpenFile(text, file.name);
          event.target.value = '';
        }}
      />

      {isImportOpen ? (
        <div className="modal-backdrop" onClick={() => setIsImportOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <span className="panel-eyebrow">Import structure text</span>
            <h2>Paste SMILES or MDL Molfile</h2>
            <textarea
              value={importDraft}
              onChange={(event) => setImportDraft(event.target.value)}
              placeholder="CC(=O)Oc1ccccc1C(=O)O"
              rows={10}
            />
            <div className="modal-actions">
              <button onClick={() => setIsImportOpen(false)}>Cancel</button>
              <button
                className="primary"
                onClick={() => {
                  const imported = importStructure(importDraft, 'Imported Structure');
                  if (!imported) {
                    window.alert('That structure text could not be parsed.');
                    return;
                  }
                  editor.reset(createEditorSnapshot(imported));
                  setIsImportOpen(false);
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDataExportOpen ? (
        <DataExportDialog
          documentName={editor.snapshot.document.name}
          prediction={nmrPrediction}
          onClose={() => setIsDataExportOpen(false)}
          onExportAnalysisJson={() => {
            const assets = buildAnalysisDataAssets();
            downloadText(
              assets.json.filename,
              assets.json.content,
              'application/json;charset=utf-8',
            );
          }}
          onExportProtonCsv={() => {
            const assets = buildAnalysisDataAssets();
            downloadText(
              assets.protonCsv.filename,
              assets.protonCsv.content,
              'text/csv;charset=utf-8',
            );
          }}
          onExportCarbonCsv={() => {
            const assets = buildAnalysisDataAssets();
            downloadText(
              assets.carbonCsv.filename,
              assets.carbonCsv.content,
              'text/csv;charset=utf-8',
            );
          }}
        />
      ) : null}

      {reportPreview ? (
        <ReportPreviewDialog
          title={reportPreview.title}
          html={reportPreview.html}
          onClose={() => setReportPreview(null)}
          onDownload={() =>
            downloadText(reportPreview.filename, reportPreview.html, 'text/html;charset=utf-8')
          }
        />
      ) : null}
    </div>
  );
}

function toSignalFocus(signal: NmrSignal, nucleus: '1H' | '13C'): NmrSignalFocus {
  return {
    id: signal.id,
    nucleus,
    assignment: signal.assignment,
    atomIds: [...signal.atomIds],
  };
}

function findProtonSignalFocus(atomIds: string[], prediction: NmrPredictionResult) {
  const protonSpectrum = prediction.proton;
  if (!protonSpectrum) {
    return null;
  }

  const targetKey = normalizeProtonAtomKey(atomIds);
  const signal = protonSpectrum.signals.find(
    (candidate) => normalizeProtonAtomKey(candidate.atomIds) === targetKey,
  );
  return signal ? toSignalFocus(signal, '1H') : null;
}

function resolveCanvasAtomIds(
  signal: NmrSignalFocus | null,
  document: ChemicalDocument,
  protonOverlayLabels: ProtonOverlayLabel[],
) {
  if (!signal) {
    return [];
  }

  if (signal.nucleus === '13C') {
    return signal.atomIds
      .map((atomId) => document.page.atoms[Number(atomId)]?.id ?? null)
      .filter((atomId): atomId is string => atomId !== null);
  }

  const targetKey = normalizeProtonAtomKey(signal.atomIds);
  return [
    ...new Set(
      protonOverlayLabels
        .filter((label) => normalizeProtonAtomKey(label.protonAtomIds) === targetKey)
        .map((label) => label.hostAtomId),
    ),
  ];
}

function reconcileSignalFocus(signal: NmrSignalFocus | null, prediction: NmrPredictionResult) {
  if (!signal) {
    return null;
  }

  const spectrum = signal.nucleus === '1H' ? prediction.proton : prediction.carbon;
  if (!spectrum) {
    return null;
  }

  const directMatch = spectrum.signals.find((candidate) => candidate.id === signal.id);
  if (directMatch) {
    return toSignalFocus(directMatch, signal.nucleus);
  }

  const normalizedAtomKey = normalizeSignalAtomKey(signal.atomIds, signal.nucleus);
  const atomMatch = spectrum.signals.find(
    (candidate) => normalizeSignalAtomKey(candidate.atomIds, signal.nucleus) === normalizedAtomKey,
  );
  if (atomMatch) {
    return toSignalFocus(atomMatch, signal.nucleus);
  }

  const assignmentMatches = spectrum.signals.filter(
    (candidate) => candidate.assignment === signal.assignment,
  );
  if (assignmentMatches.length === 1) {
    return toSignalFocus(assignmentMatches[0], signal.nucleus);
  }

  return null;
}

function normalizeSignalAtomKey(atomIds: string[], nucleus: '1H' | '13C') {
  return nucleus === '1H'
    ? normalizeProtonAtomKey(atomIds)
    : [...atomIds].sort((left, right) => left.localeCompare(right)).join('_');
}

function signalFocusEquals(left: NmrSignalFocus | null, right: NmrSignalFocus | null) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return left === right;
  }

  return (
    left.id === right.id &&
    left.nucleus === right.nucleus &&
    left.assignment === right.assignment &&
    normalizeSignalAtomKey(left.atomIds, left.nucleus) ===
      normalizeSignalAtomKey(right.atomIds, right.nucleus)
  );
}

function toggleSignalSelection(current: NmrSignalFocus | null, next: NmrSignalFocus | null) {
  if (!next) {
    return null;
  }

  if (current && current.nucleus === next.nucleus) {
    const currentAtomKey = normalizeSignalAtomKey(current.atomIds, current.nucleus);
    const nextAtomKey = normalizeSignalAtomKey(next.atomIds, next.nucleus);
    if (current.id === next.id || currentAtomKey === nextAtomKey) {
      return null;
    }
  }

  if (signalFocusEquals(current, next)) {
    return null;
  }

  return next;
}
