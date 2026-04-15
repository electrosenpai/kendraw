import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { ELEMENTS } from '../chem/constants';
import {
  buildConstrainedChain,
  createConstrainedRingAt,
  resolveConstrainedBondPlacement,
  validateAtomElementChange,
  validateBondCreation,
  validateBondInsertion,
  validateBondTypeChange,
} from '../chem/constraints';
import {
  addAtom,
  addBond,
  cloneSnapshot,
  createId,
  findAtom,
  findBond,
  moveSelection,
  removeEntity,
  selectionBounds,
  splitBondWithAtom,
} from '../chem/document';
import {
  angleBetween,
  clamp,
  distance,
  midpoint,
  normalize,
  perpendicular,
  pointsInRect,
  polar,
  projectPointToSegment,
  snapPoint,
} from '../chem/geometry';
import { nextBondType } from '../editor/tools';
import type { AtomNode, BondEdge, EditorSnapshot, HitResult, Point } from '../chem/types';
import type { ProtonOverlayLabel } from '../chem/proton-numbering';

const RULER_GUTTER = 28;

export interface EditorCanvasHandle {
  exportPng(name: string): void;
}

interface EditorCanvasProps {
  snapshot: EditorSnapshot;
  protonOverlayLabels: ProtonOverlayLabel[];
  selectedCanvasAtomIds: string[];
  hoveredCanvasAtomIds: string[];
  selectedProtonAtomIds: string[];
  hoveredProtonAtomIds: string[];
  onProtonOverlayHover(protonAtomIds: string[] | null): void;
  onProtonOverlaySelect(protonAtomIds: string[]): void;
  onPatch(transform: (draft: EditorSnapshot) => void): void;
  onCommit(label: string, before: EditorSnapshot, after: EditorSnapshot): void;
  onExecute(label: string, transform: (draft: EditorSnapshot) => void): void;
  onCursorChange(point: Point | null): void;
}

interface ViewMetrics {
  width: number;
  height: number;
  gutter: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  pageWidth: number;
  pageHeight: number;
}

type Interaction =
  | {
      mode: 'move';
      before: EditorSnapshot;
      lastDoc: Point;
      moved: boolean;
    }
  | {
      mode: 'selectBox';
      start: Point;
      current: Point;
      visible: boolean;
    }
  | {
      mode: 'bond';
      start: Point;
      current: Point;
      startHit: HitResult | null;
    }
  | {
      mode: 'chain';
      start: Point;
      current: Point;
      startHit: HitResult | null;
    }
  | {
      mode: 'arrow';
      start: Point;
      current: Point;
    }
  | {
      mode: 'pan';
      lastScreen: Point;
    }
  | null;

type ProtonOverlayNode = ProtonOverlayLabel & {
  center: Point;
  width: number;
  height: number;
  isHovered: boolean;
  isSelected: boolean;
};

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  function EditorCanvas(props, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [viewportSize, setViewportSize] = useState({ width: 960, height: 720 });
    const [hovered, setHovered] = useState<HitResult | null>(null);
    const [interaction, setInteraction] = useState<Interaction>(null);
    const [cursorDocPoint, setCursorDocPoint] = useState<Point | null>(null);

    useImperativeHandle(ref, () => ({
      exportPng(name: string) {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${name.replace(/\s+/g, '_').toLowerCase() || 'structure'}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      },
    }));

    useEffect(() => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        setViewportSize({
          width: Math.max(320, entry.contentRect.width),
          height: Math.max(320, entry.contentRect.height),
        });
      });

      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const handleCanvasWheel = useEffectEvent((event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const screenPoint = getScreenPoint(event, containerRef.current);
      const beforeDoc = toDocPoint(screenPoint, metrics);
      const nextZoom = clamp(
        props.snapshot.viewport.zoom * (event.deltaY < 0 ? 1.1 : 0.92),
        0.35,
        3.5,
      );

      props.onPatch((draft) => {
        draft.viewport.zoom = nextZoom;
        const nextMetrics = getMetrics(viewportSize.width, viewportSize.height, draft);
        const afterScreen = toScreenPoint(beforeDoc, nextMetrics);
        draft.viewport.panX += screenPoint.x - afterScreen.x;
        draft.viewport.panY += screenPoint.y - afterScreen.y;
      });
    });

    useEffect(() => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const onWheel = (event: WheelEvent) => {
        handleCanvasWheel(event);
      };

      element.addEventListener('wheel', onWheel, { passive: false });
      return () => element.removeEventListener('wheel', onWheel);
    }, []);

    const metrics = getMetrics(viewportSize.width, viewportSize.height, props.snapshot);
    const protonOverlayNodes = buildProtonOverlayNodes(
      props.snapshot,
      metrics,
      props.protonOverlayLabels,
      props.selectedProtonAtomIds,
      props.hoveredProtonAtomIds,
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewportSize.width * dpr);
      canvas.height = Math.floor(viewportSize.height * dpr);
      canvas.style.width = `${viewportSize.width}px`;
      canvas.style.height = `${viewportSize.height}px`;

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(
        context,
        props.snapshot,
        metrics,
        interaction,
        hovered,
        cursorDocPoint,
        protonOverlayNodes,
        props.selectedCanvasAtomIds,
        props.hoveredCanvasAtomIds,
      );
    }, [
      props.snapshot,
      props.protonOverlayLabels,
      props.selectedCanvasAtomIds,
      props.hoveredCanvasAtomIds,
      protonOverlayNodes,
      viewportSize.width,
      viewportSize.height,
      metrics,
      interaction,
      hovered,
      cursorDocPoint,
    ]);

    function setStatus(statusText: string) {
      props.onPatch((draft) => {
        draft.statusText = statusText;
      });
    }

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
      const screenPoint = getScreenPoint(event, containerRef.current);
      const docPoint = toDocPoint(screenPoint, metrics);
      const snappedDoc = resolveSnap(docPoint, props.snapshot);
      const protonOverlayHit = hitProtonOverlay(protonOverlayNodes, screenPoint);
      if (protonOverlayHit) {
        props.onProtonOverlayHover(protonOverlayHit.protonAtomIds);
        if (props.snapshot.activeTool === 'select' && event.button === 0) {
          props.onProtonOverlaySelect(protonOverlayHit.protonAtomIds);
          return;
        }
      }

      const hit = hitTest(props.snapshot, docPoint, metrics);
      const selectedAnchorId = getSingleSelectedAtomId(props.snapshot);
      const selectedAnchor = selectedAnchorId
        ? findAtom(props.snapshot.document, selectedAnchorId)
        : null;
      const drawingStartHit =
        hit ?? (selectedAnchorId ? { id: selectedAnchorId, kind: 'atom' as const } : null);
      const drawingStartPoint =
        drawingStartHit?.kind === 'atom'
          ? (resolveHitPoint(props.snapshot, drawingStartHit) ?? snappedDoc)
          : snappedDoc;

      event.currentTarget.setPointerCapture(event.pointerId);

      if (props.snapshot.activeTool === 'pan' || event.button === 1) {
        setInteraction({
          mode: 'pan',
          lastScreen: screenPoint,
        });
        return;
      }

      if (props.snapshot.activeTool === 'erase') {
        if (hit) {
          props.onExecute('Erase Object', (draft) => {
            removeEntity(draft.document, hit.id);
            draft.selectionIds = draft.selectionIds.filter((selectionId) => selectionId !== hit.id);
          });
        }
        return;
      }

      if (props.snapshot.activeTool === 'atom') {
        const atomLabel =
          hit?.kind === 'atom'
            ? `Set atom to ${props.snapshot.activeElement}`
            : hit?.kind === 'bond'
              ? `Insert ${props.snapshot.activeElement}`
              : selectedAnchor
                ? `Extend with ${props.snapshot.activeElement}`
                : `Add ${props.snapshot.activeElement}`;

        if (hit?.kind === 'atom') {
          const validation = validateAtomElementChange(
            props.snapshot.document,
            hit.id,
            props.snapshot.activeElement,
          );
          if (!validation.ok) {
            setStatus(validation.statusText);
            return;
          }

          const before = cloneSnapshot(props.snapshot);
          const after = cloneSnapshot(props.snapshot);
          const atom = findAtom(after.document, hit.id);
          if (!atom) {
            setStatus('Selected atom could not be found.');
            return;
          }
          atom.element = after.activeElement;
          after.selectionIds = [atom.id];
          after.statusText = validation.statusText;
          props.onCommit(atomLabel, before, after);
          return;
        }

        if (hit?.kind === 'bond') {
          const validation = validateBondInsertion(
            props.snapshot.document,
            hit.id,
            props.snapshot.activeElement,
          );
          if (!validation.ok) {
            setStatus(validation.statusText);
            return;
          }

          const before = cloneSnapshot(props.snapshot);
          const after = cloneSnapshot(props.snapshot);
          const insertPoint = projectPointOnBond(after.document, hit.id, docPoint);
          if (!insertPoint) {
            setStatus('The bond insertion point could not be resolved.');
            return;
          }

          const split = splitBondWithAtom(after.document, hit.id, insertPoint, after.activeElement);
          if (!split) {
            setStatus('This bond could not be split.');
            return;
          }
          after.selectionIds = [split.atom.id, split.leftBond.id, split.rightBond.id];
          after.statusText = validation.statusText;
          props.onCommit(atomLabel, before, after);
          return;
        }

        if (selectedAnchor) {
          const placement = resolveConstrainedBondPlacement(
            props.snapshot.document,
            selectedAnchor,
            snappedDoc,
            {
              targetElement: props.snapshot.activeElement,
              bondType: props.snapshot.activeBondType,
              fixedLength: props.snapshot.settings.fixedBondLength,
              bondLength: props.snapshot.settings.bondLength,
            },
          );
          if (!placement.ok) {
            setStatus(placement.statusText);
            return;
          }

          const before = cloneSnapshot(props.snapshot);
          const after = cloneSnapshot(props.snapshot);
          const anchorId = getSingleSelectedAtomId(after);
          const anchor = anchorId ? findAtom(after.document, anchorId) : null;
          if (!anchor) {
            setStatus('The anchor atom could not be found.');
            return;
          }
          const atom = addAtom(after.document, placement.point, after.activeElement);
          const bond = addBond(after.document, [anchor.id, atom.id], after.activeBondType);
          after.selectionIds = [anchor.id, atom.id, bond.id];
          after.statusText = placement.statusText;
          props.onCommit(atomLabel, before, after);
          return;
        }

        const before = cloneSnapshot(props.snapshot);
        const after = cloneSnapshot(props.snapshot);
        const atom = addAtom(after.document, snappedDoc, after.activeElement);
        after.selectionIds = [atom.id];
        after.statusText = `Added ${after.activeElement} without changing the existing valence network.`;
        props.onCommit(atomLabel, before, after);
        return;
      }

      if (props.snapshot.activeTool === 'text') {
        const text = window.prompt('Text annotation', 'Reagent / note');
        if (text && text.trim()) {
          props.onExecute('Add Text Annotation', (draft) => {
            draft.document.page.texts.push({
              id: createId('text'),
              text: text.trim(),
              x: snappedDoc.x,
              y: snappedDoc.y,
              fontSize: draft.settings.fontSize,
              color: draft.settings.singleColor,
            });
          });
        }
        return;
      }

      if (props.snapshot.activeTool === 'ring') {
        const before = cloneSnapshot(props.snapshot);
        const after = cloneSnapshot(props.snapshot);
        const ring = createConstrainedRingAt(
          snappedDoc,
          after.activeRingTemplate,
          after.settings.bondLength,
        );
        after.document.page.atoms.push(...ring.atoms);
        after.document.page.bonds.push(...ring.bonds);
        after.selectionIds = ring.atoms.map((atom) => atom.id);
        after.statusText = ring.statusText;
        props.onCommit('Add Ring', before, after);
        return;
      }

      if (props.snapshot.activeTool === 'arrow') {
        setInteraction({
          mode: 'arrow',
          start: snappedDoc,
          current: snappedDoc,
        });
        return;
      }

      if (props.snapshot.activeTool === 'bond') {
        setInteraction({
          mode: 'bond',
          start: drawingStartPoint,
          current: snappedDoc,
          startHit: drawingStartHit,
        });
        return;
      }

      if (props.snapshot.activeTool === 'chain') {
        setInteraction({
          mode: 'chain',
          start: drawingStartPoint,
          current: snappedDoc,
          startHit: drawingStartHit,
        });
        return;
      }

      if (props.snapshot.activeTool === 'select') {
        if (hit) {
          const nextSelection = event.shiftKey
            ? Array.from(new Set([...props.snapshot.selectionIds, hit.id]))
            : props.snapshot.selectionIds.includes(hit.id)
              ? props.snapshot.selectionIds
              : [hit.id];
          const before = cloneSnapshot(props.snapshot);
          before.selectionIds = nextSelection;
          props.onPatch((draft) => {
            draft.selectionIds = nextSelection;
          });
          setInteraction({
            mode: 'move',
            before,
            lastDoc: docPoint,
            moved: false,
          });
        } else {
          props.onPatch((draft) => {
            draft.selectionIds = [];
          });
          setInteraction({
            mode: 'selectBox',
            start: docPoint,
            current: docPoint,
            visible: false,
          });
        }
      }
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      const screenPoint = getScreenPoint(event, containerRef.current);
      const docPoint = toDocPoint(screenPoint, metrics);
      const protonOverlayHit = hitProtonOverlay(protonOverlayNodes, screenPoint);
      const hit = protonOverlayHit ? null : hitTest(props.snapshot, docPoint, metrics);
      props.onCursorChange(docPoint);
      setCursorDocPoint(docPoint);
      props.onProtonOverlayHover(protonOverlayHit ? protonOverlayHit.protonAtomIds : null);

      if (!interaction) {
        setHovered(hit);
        return;
      }

      setHovered(null);

      if (interaction.mode === 'pan') {
        const delta = {
          x: screenPoint.x - interaction.lastScreen.x,
          y: screenPoint.y - interaction.lastScreen.y,
        };

        props.onPatch((draft) => {
          draft.viewport.panX += delta.x;
          draft.viewport.panY += delta.y;
        });
        setInteraction({
          ...interaction,
          lastScreen: screenPoint,
        });
        return;
      }

      if (interaction.mode === 'move') {
        const delta = {
          x: docPoint.x - interaction.lastDoc.x,
          y: docPoint.y - interaction.lastDoc.y,
        };
        if (Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
          props.onPatch((draft) => {
            moveSelection(draft.document, draft.selectionIds, delta);
          });
        }
        setInteraction({
          ...interaction,
          lastDoc: docPoint,
          moved: interaction.moved || Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0,
        });
        return;
      }

      if (interaction.mode === 'selectBox') {
        const visible =
          interaction.visible ||
          distance(interaction.start, docPoint) > Math.max(4, 6 / metrics.zoom);
        setInteraction({
          ...interaction,
          current: docPoint,
          visible,
        });
        return;
      }

      if (
        interaction.mode === 'bond' ||
        interaction.mode === 'chain' ||
        interaction.mode === 'arrow'
      ) {
        setInteraction({
          ...interaction,
          current: resolveSnap(docPoint, props.snapshot),
        });
      }
    }

    function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
      const screenPoint = getScreenPoint(event, containerRef.current);
      const docPoint = toDocPoint(screenPoint, metrics);
      const snappedDoc = resolveSnap(docPoint, props.snapshot);
      const currentSnapshot = cloneSnapshot(props.snapshot);

      if (!interaction) {
        return;
      }

      if (interaction.mode === 'move') {
        if (interaction.moved) {
          props.onCommit('Move Selection', interaction.before, currentSnapshot);
        }
        setInteraction(null);
        return;
      }

      if (interaction.mode === 'pan') {
        setInteraction(null);
        return;
      }

      if (interaction.mode === 'selectBox') {
        if (interaction.visible) {
          const selectedAtoms = pointsInRect(
            props.snapshot.document.page.atoms.map((atom) => ({
              id: atom.id,
              x: atom.x,
              y: atom.y,
            })),
            interaction.start,
            interaction.current,
          ).map((atom) => atom.id);

          const selectedTexts = props.snapshot.document.page.texts
            .filter((text) =>
              insideRect({ x: text.x, y: text.y }, interaction.start, interaction.current),
            )
            .map((text) => text.id);

          const selectedArrows = props.snapshot.document.page.arrows
            .filter(
              (arrow) =>
                insideRect(arrow.from, interaction.start, interaction.current) ||
                insideRect(arrow.to, interaction.start, interaction.current),
            )
            .map((arrow) => arrow.id);

          props.onPatch((draft) => {
            draft.selectionIds = [...selectedAtoms, ...selectedTexts, ...selectedArrows];
          });
        }
        setInteraction(null);
        return;
      }

      if (interaction.mode === 'bond') {
        const dragDistance = distance(interaction.start, interaction.current);
        const endHit = hitTest(props.snapshot, docPoint, metrics);

        if (interaction.startHit?.kind === 'bond' && dragDistance < 8) {
          const currentBond = findBond(props.snapshot.document, interaction.startHit.id);
          if (!currentBond) {
            setStatus('Selected bond could not be found.');
            setInteraction(null);
            return;
          }
          const nextType = nextBondType(currentBond.type);
          const validation = validateBondTypeChange(
            props.snapshot.document,
            interaction.startHit.id,
            nextType,
          );
          if (!validation.ok) {
            setStatus(validation.statusText);
            setInteraction(null);
            return;
          }

          const before = cloneSnapshot(props.snapshot);
          const after = cloneSnapshot(props.snapshot);
          const bond = findBond(after.document, interaction.startHit.id);
          if (!bond) {
            setStatus('Selected bond could not be found.');
            setInteraction(null);
            return;
          }
          bond.type = nextType;
          bond.order =
            nextType === 'aromatic'
              ? 1.5
              : nextType === 'double'
                ? 2
                : nextType === 'triple'
                  ? 3
                  : 1;
          bond.display = nextType === 'aromatic' ? 'aromatic' : 'normal';
          after.selectionIds = [bond.id];
          after.statusText = validation.statusText;
          props.onCommit('Cycle Bond Type', before, after);
          setInteraction(null);
          return;
        }

        const before = cloneSnapshot(props.snapshot);
        const after = cloneSnapshot(props.snapshot);
        const startPoint = interaction.startHit?.kind === 'atom' ? null : interaction.start;

        let beginAtomId = interaction.startHit?.kind === 'atom' ? interaction.startHit.id : null;
        if (!beginAtomId && startPoint) {
          const beginAtom = addAtom(after.document, interaction.start, 'C');
          beginAtomId = beginAtom.id;
        }

        if (!beginAtomId) {
          setInteraction(null);
          return;
        }

        let endAtomId = endHit?.kind === 'atom' && endHit.id !== beginAtomId ? endHit.id : null;
        let statusText = 'Bond drawn.';
        if (!endAtomId) {
          const anchor = findAtom(after.document, beginAtomId);
          if (!anchor) {
            setInteraction(null);
            return;
          }
          const fallbackPoint =
            dragDistance < 4 ? polar(anchor, after.settings.bondLength, 0) : snappedDoc;
          const placement = resolveConstrainedBondPlacement(after.document, anchor, fallbackPoint, {
            targetElement: 'C',
            bondType: after.activeBondType,
            fixedLength: after.settings.fixedBondLength,
            bondLength: after.settings.bondLength,
          });
          if (!placement.ok) {
            setStatus(placement.statusText);
            setInteraction(null);
            return;
          }
          const endPoint = placement.point;
          const endAtom = addAtom(after.document, endPoint, 'C');
          endAtomId = endAtom.id;
          statusText = placement.statusText;
        }

        const beginAtom = findAtom(after.document, beginAtomId);
        const endAtom = findAtom(after.document, endAtomId);
        if (!beginAtom || !endAtom) {
          setStatus('Bond endpoints could not be resolved.');
          setInteraction(null);
          return;
        }

        const validation = validateBondCreation(
          after.document,
          beginAtom,
          endAtom,
          after.activeBondType,
        );
        if (!validation.ok) {
          setStatus(validation.statusText);
          setInteraction(null);
          return;
        }

        const bond = addBond(after.document, [beginAtomId, endAtomId], after.activeBondType);
        after.selectionIds = [beginAtomId, endAtomId, bond.id];
        after.statusText = statusText === 'Bond drawn.' ? validation.statusText : statusText;
        props.onCommit('Draw Bond', before, after);
        setInteraction(null);
        return;
      }

      if (interaction.mode === 'chain') {
        const before = cloneSnapshot(props.snapshot);
        const after = cloneSnapshot(props.snapshot);
        const anchorAtom =
          interaction.startHit?.kind === 'atom'
            ? findAtom(after.document, interaction.startHit.id)
            : null;
        const startPoint = anchorAtom ? { x: anchorAtom.x, y: anchorAtom.y } : interaction.start;
        const segments = clamp(
          Math.round(distance(startPoint, interaction.current) / after.settings.bondLength),
          1,
          12,
        );
        const chain = buildConstrainedChain(
          after.document,
          startPoint,
          interaction.current,
          segments,
          {
            anchorAtomId: anchorAtom?.id ?? null,
            fixedLength: after.settings.fixedBondLength,
            bondLength: after.settings.bondLength,
          },
        );
        if (!chain.ok) {
          setStatus(chain.statusText);
          setInteraction(null);
          return;
        }

        const createdIds: string[] = [];

        let previousAtomId = anchorAtom?.id ?? null;
        if (!previousAtomId) {
          const firstAtom = addAtom(after.document, chain.points[0], 'C');
          previousAtomId = firstAtom.id;
          createdIds.push(firstAtom.id);
        }

        for (let index = 1; index < chain.points.length; index += 1) {
          const atom = addAtom(after.document, chain.points[index], 'C');
          createdIds.push(atom.id);
          const bond = addBond(after.document, [previousAtomId, atom.id], 'single');
          createdIds.push(bond.id);
          previousAtomId = atom.id;
        }

        after.selectionIds = createdIds;
        after.statusText = chain.statusText;
        props.onCommit('Draw Chain', before, after);
        setInteraction(null);
        return;
      }

      if (interaction.mode === 'arrow') {
        const before = cloneSnapshot(props.snapshot);
        const after = cloneSnapshot(props.snapshot);
        const horizontal =
          Math.abs(interaction.current.x - interaction.start.x) >=
          Math.abs(interaction.current.y - interaction.start.y);
        after.document.page.arrows.push({
          id: createId('arrow'),
          from: interaction.start,
          to: horizontal
            ? { x: interaction.current.x, y: interaction.start.y }
            : interaction.current,
          type: 'reaction',
          color: after.settings.singleColor,
        });
        props.onCommit('Draw Reaction Arrow', before, after);
        setInteraction(null);
        return;
      }
    }

    return (
      <div
        ref={containerRef}
        className="editor-canvas-shell"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHovered(null);
          setCursorDocPoint(null);
          props.onProtonOverlayHover(null);
          props.onCursorChange(null);
        }}
        data-tool={props.snapshot.activeTool}
      >
        <canvas ref={canvasRef} className="editor-canvas" />

        <svg className="editor-overlay" width={viewportSize.width} height={viewportSize.height}>
          {renderSelectionOverlay(props.snapshot, metrics)}
          {renderHoverOverlay(props.snapshot, metrics, hovered)}
          {interaction?.mode === 'selectBox' && interaction.visible ? (
            <rect
              x={Math.min(
                toScreenPoint(interaction.start, metrics).x,
                toScreenPoint(interaction.current, metrics).x,
              )}
              y={Math.min(
                toScreenPoint(interaction.start, metrics).y,
                toScreenPoint(interaction.current, metrics).y,
              )}
              width={Math.abs(
                toScreenPoint(interaction.current, metrics).x -
                  toScreenPoint(interaction.start, metrics).x,
              )}
              height={Math.abs(
                toScreenPoint(interaction.current, metrics).y -
                  toScreenPoint(interaction.start, metrics).y,
              )}
              className="selection-rect"
            />
          ) : null}
        </svg>
      </div>
    );
  },
);

function getMetrics(width: number, height: number, snapshot: EditorSnapshot): ViewMetrics {
  const gutter = snapshot.viewport.showRulers ? RULER_GUTTER : 0;
  const zoom = snapshot.viewport.zoom;
  const pageWidth = snapshot.document.page.size.width;
  const pageHeight = snapshot.document.page.size.height;
  const offsetX = gutter + (width - gutter - pageWidth * zoom) / 2 + snapshot.viewport.panX;
  const offsetY = gutter + (height - gutter - pageHeight * zoom) / 2 + snapshot.viewport.panY;

  return {
    width,
    height,
    gutter,
    zoom,
    offsetX,
    offsetY,
    pageWidth,
    pageHeight,
  };
}

function toScreenPoint(point: Point, metrics: ViewMetrics): Point {
  return {
    x: metrics.offsetX + point.x * metrics.zoom,
    y: metrics.offsetY + point.y * metrics.zoom,
  };
}

function toDocPoint(point: Point, metrics: ViewMetrics): Point {
  return {
    x: (point.x - metrics.offsetX) / metrics.zoom,
    y: (point.y - metrics.offsetY) / metrics.zoom,
  };
}

function getScreenPoint(
  event:
    | Pick<ReactPointerEvent<HTMLDivElement>, 'clientX' | 'clientY'>
    | Pick<ReactWheelEvent<HTMLDivElement>, 'clientX' | 'clientY'>,
  element: HTMLDivElement | null,
): Point {
  const rect = element?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function resolveSnap(point: Point, snapshot: EditorSnapshot) {
  return snapshot.viewport.snapToGrid ? snapPoint(point, snapshot.settings.gridSize) : point;
}

function resolveBondEndpoint(
  snapshot: EditorSnapshot,
  anchor: AtomNode | Point,
  point: Point,
  targetElement = 'C',
  bondType = snapshot.activeBondType,
) {
  if ('element' in anchor) {
    const placement = resolveConstrainedBondPlacement(snapshot.document, anchor, point, {
      targetElement,
      bondType,
      fixedLength: snapshot.settings.fixedBondLength,
      bondLength: snapshot.settings.bondLength,
    });
    if (placement.ok) {
      return placement.point;
    }
    return null;
  }

  const rawAngle = angleBetween(anchor, point);
  const snappedAngle = Math.round(rawAngle / (Math.PI / 6)) * (Math.PI / 6);
  const length = snapshot.settings.fixedBondLength
    ? snapshot.settings.bondLength
    : Math.max(snapshot.settings.bondLength * 0.55, distance(anchor, point));
  return polar(anchor, length, snappedAngle);
}

function getSingleSelectedAtomId(snapshot: EditorSnapshot) {
  if (snapshot.selectionIds.length !== 1) {
    return null;
  }

  const atom = findAtom(snapshot.document, snapshot.selectionIds[0]);
  return atom?.id ?? null;
}

function resolveHitPoint(snapshot: EditorSnapshot, hit: HitResult | null) {
  if (!hit) {
    return null;
  }

  if (hit.kind === 'atom') {
    const atom = findAtom(snapshot.document, hit.id);
    return atom ? { x: atom.x, y: atom.y } : null;
  }

  if (hit.kind === 'bond') {
    const bond = findBond(snapshot.document, hit.id);
    if (!bond) {
      return null;
    }
    const begin = findAtom(snapshot.document, bond.atomIds[0]);
    const end = findAtom(snapshot.document, bond.atomIds[1]);
    return begin && end ? midpoint(begin, end) : null;
  }

  if (hit.kind === 'text') {
    const text = snapshot.document.page.texts.find((entry) => entry.id === hit.id);
    return text ? { x: text.x, y: text.y } : null;
  }

  const arrow = snapshot.document.page.arrows.find((entry) => entry.id === hit.id);
  return arrow ? midpoint(arrow.from, arrow.to) : null;
}

function projectPointOnBond(snapshot: EditorSnapshot['document'], bondId: string, point: Point) {
  const bond = findBond(snapshot, bondId);
  if (!bond) {
    return null;
  }

  const begin = findAtom(snapshot, bond.atomIds[0]);
  const end = findAtom(snapshot, bond.atomIds[1]);
  if (!begin || !end) {
    return null;
  }

  const projection = projectPointToSegment(point, begin, end);
  const vector = { x: end.x - begin.x, y: end.y - begin.y };
  const lengthSquared = vector.x * vector.x + vector.y * vector.y;
  if (lengthSquared === 0) {
    return midpoint(begin, end);
  }

  const rawT =
    ((projection.x - begin.x) * vector.x + (projection.y - begin.y) * vector.y) / lengthSquared;
  const safeT = clamp(rawT, 0.22, 0.78);
  return {
    x: begin.x + vector.x * safeT,
    y: begin.y + vector.y * safeT,
  };
}

function resolveAtomColor(snapshot: EditorSnapshot, element: string, color: string | null = null) {
  return (
    color ??
    (snapshot.settings.atomColorMode === 'cpk'
      ? (ELEMENTS[element]?.color ?? snapshot.settings.singleColor)
      : snapshot.settings.singleColor)
  );
}

function hitTest(
  snapshot: EditorSnapshot,
  docPoint: Point,
  metrics: ViewMetrics,
): HitResult | null {
  const atomRadius = 14 / metrics.zoom;
  const bondRadius = 9 / metrics.zoom;

  for (const atom of [...snapshot.document.page.atoms].reverse()) {
    if (distance(atom, docPoint) <= atomRadius) {
      return { id: atom.id, kind: 'atom' };
    }
  }

  for (const text of [...snapshot.document.page.texts].reverse()) {
    const width = Math.max(56, text.text.length * text.fontSize * 0.55);
    if (
      docPoint.x >= text.x - 6 &&
      docPoint.x <= text.x + width / metrics.zoom &&
      docPoint.y >= text.y - text.fontSize &&
      docPoint.y <= text.y + 6
    ) {
      return { id: text.id, kind: 'text' };
    }
  }

  for (const arrow of [...snapshot.document.page.arrows].reverse()) {
    const projection = projectPointToSegment(docPoint, arrow.from, arrow.to);
    if (distance(docPoint, projection) <= bondRadius) {
      return { id: arrow.id, kind: 'arrow' };
    }
  }

  for (const bond of [...snapshot.document.page.bonds].reverse()) {
    const begin = findAtom(snapshot.document, bond.atomIds[0]);
    const end = findAtom(snapshot.document, bond.atomIds[1]);
    if (!begin || !end) {
      continue;
    }
    const projection = projectPointToSegment(docPoint, begin, end);
    if (distance(docPoint, projection) <= bondRadius) {
      return { id: bond.id, kind: 'bond' };
    }
  }

  return null;
}

function drawScene(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
  interaction: Interaction,
  hovered: HitResult | null,
  cursorDocPoint: Point | null,
  protonOverlayNodes: ProtonOverlayNode[],
  selectedCanvasAtomIds: string[],
  hoveredCanvasAtomIds: string[],
) {
  context.clearRect(0, 0, metrics.width, metrics.height);
  context.fillStyle = '#0b1220';
  context.fillRect(0, 0, metrics.width, metrics.height);

  drawRulers(context, snapshot, metrics);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.35)';
  context.shadowBlur = 22;
  context.shadowOffsetY = 12;
  context.fillStyle = snapshot.document.page.background;
  context.fillRect(
    metrics.offsetX,
    metrics.offsetY,
    metrics.pageWidth * metrics.zoom,
    metrics.pageHeight * metrics.zoom,
  );
  context.restore();

  context.save();
  context.beginPath();
  context.rect(
    metrics.offsetX,
    metrics.offsetY,
    metrics.pageWidth * metrics.zoom,
    metrics.pageHeight * metrics.zoom,
  );
  context.clip();

  if (snapshot.viewport.showGrid) {
    drawGrid(context, snapshot, metrics);
  }

  for (const arrow of snapshot.document.page.arrows) {
    drawArrow(context, arrow.from, arrow.to, arrow.color, metrics);
  }

  for (const bond of snapshot.document.page.bonds) {
    drawBond(context, snapshot, bond, metrics);
  }

  drawHighlightedAtoms(context, snapshot, metrics, hoveredCanvasAtomIds, 'hovered');
  drawHighlightedAtoms(context, snapshot, metrics, selectedCanvasAtomIds, 'selected');

  for (const atom of snapshot.document.page.atoms) {
    drawAtom(context, snapshot, atom, metrics);
  }

  for (const text of snapshot.document.page.texts) {
    const screen = toScreenPoint(text, metrics);
    context.fillStyle = text.color;
    context.font = `${Math.max(13, text.fontSize * metrics.zoom * 0.72)}px ${snapshot.settings.fontFamily}`;
    context.fillText(text.text, screen.x, screen.y);
  }

  drawProtonOverlayLabels(context, protonOverlayNodes);
  drawPreview(context, snapshot, metrics, interaction, hovered, cursorDocPoint);
  context.restore();
}

function drawRulers(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
) {
  if (!snapshot.viewport.showRulers) {
    return;
  }

  context.save();
  context.fillStyle = '#111a2b';
  context.fillRect(0, 0, metrics.width, RULER_GUTTER);
  context.fillRect(0, 0, RULER_GUTTER, metrics.height);
  context.strokeStyle = 'rgba(188, 215, 255, 0.18)';
  context.lineWidth = 1;

  const step = snapshot.settings.gridSize * metrics.zoom;
  for (
    let x = metrics.offsetX;
    x <= metrics.offsetX + metrics.pageWidth * metrics.zoom;
    x += step
  ) {
    context.beginPath();
    context.moveTo(x, RULER_GUTTER - 8);
    context.lineTo(x, RULER_GUTTER);
    context.stroke();
  }

  for (
    let y = metrics.offsetY;
    y <= metrics.offsetY + metrics.pageHeight * metrics.zoom;
    y += step
  ) {
    context.beginPath();
    context.moveTo(RULER_GUTTER - 8, y);
    context.lineTo(RULER_GUTTER, y);
    context.stroke();
  }

  context.fillStyle = '#95abc7';
  context.font = '10px "IBM Plex Sans", "Aptos", sans-serif';
  context.fillText('x', 8, 18);
  context.fillText('y', 10, 40);
  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
) {
  context.save();
  context.strokeStyle = 'rgba(110, 152, 203, 0.12)';
  context.lineWidth = 1;

  for (let x = 0; x <= snapshot.document.page.size.width; x += snapshot.settings.gridSize) {
    const start = toScreenPoint({ x, y: 0 }, metrics);
    const end = toScreenPoint({ x, y: snapshot.document.page.size.height }, metrics);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  for (let y = 0; y <= snapshot.document.page.size.height; y += snapshot.settings.gridSize) {
    const start = toScreenPoint({ x: 0, y }, metrics);
    const end = toScreenPoint({ x: snapshot.document.page.size.width, y }, metrics);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  context.restore();
}

function drawBond(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  bond: BondEdge,
  metrics: ViewMetrics,
) {
  const beginAtom = findAtom(snapshot.document, bond.atomIds[0]);
  const endAtom = findAtom(snapshot.document, bond.atomIds[1]);
  if (!beginAtom || !endAtom) {
    return;
  }

  const begin = toScreenPoint(beginAtom, metrics);
  const end = toScreenPoint(endAtom, metrics);
  const vector = normalize({ x: end.x - begin.x, y: end.y - begin.y });
  const ortho = perpendicular(vector);
  const lineWidth = Math.max(1, snapshot.settings.lineWidth * metrics.zoom * 0.6);
  const spacing = snapshot.settings.bondSpacing * metrics.zoom * 0.45;
  const resolvedColor = bond.color ?? snapshot.settings.singleColor;

  context.save();
  context.strokeStyle = resolvedColor;
  context.fillStyle = resolvedColor;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = lineWidth;

  if (bond.type === 'double' || (bond.type === 'aromatic' && bond.display === 'aromatic')) {
    drawParallelLine(context, begin, end, ortho, spacing);
    drawParallelLine(context, begin, end, ortho, -spacing);
    if (bond.type === 'aromatic') {
      context.setLineDash([8, 7]);
      drawParallelLine(context, begin, end, ortho, 0);
    }
  } else if (bond.type === 'triple') {
    drawParallelLine(context, begin, end, ortho, spacing * 1.3);
    drawParallelLine(context, begin, end, ortho, 0);
    drawParallelLine(context, begin, end, ortho, -spacing * 1.3);
  } else if (bond.type === 'wedge') {
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x + ortho.x * 7, end.y + ortho.y * 7);
    context.lineTo(end.x - ortho.x * 7, end.y - ortho.y * 7);
    context.closePath();
    context.fill();
  } else if (bond.type === 'dash') {
    for (let index = 0; index < 7; index += 1) {
      const t = index / 7;
      const point = {
        x: begin.x + (end.x - begin.x) * t,
        y: begin.y + (end.y - begin.y) * t,
      };
      const width = 2 + index * 1.3;
      context.beginPath();
      context.moveTo(point.x - ortho.x * width, point.y - ortho.y * width);
      context.lineTo(point.x + ortho.x * width, point.y + ortho.y * width);
      context.stroke();
    }
  } else if (bond.type === 'wavy') {
    context.beginPath();
    for (let index = 0; index <= 16; index += 1) {
      const t = index / 16;
      const point = {
        x: begin.x + (end.x - begin.x) * t + ortho.x * Math.sin(t * Math.PI * 8) * 4,
        y: begin.y + (end.y - begin.y) * t + ortho.y * Math.sin(t * Math.PI * 8) * 4,
      };
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }
    context.stroke();
  } else if (bond.type === 'bold') {
    context.lineWidth = snapshot.settings.boldWidth * metrics.zoom * 0.45;
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  } else if (bond.type === 'dative') {
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    drawArrowHead(context, begin, end, resolvedColor);
  } else {
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  context.restore();
}

function drawParallelLine(
  context: CanvasRenderingContext2D,
  begin: Point,
  end: Point,
  ortho: Point,
  offset: number,
) {
  context.beginPath();
  context.moveTo(begin.x + ortho.x * offset, begin.y + ortho.y * offset);
  context.lineTo(end.x + ortho.x * offset, end.y + ortho.y * offset);
  context.stroke();
}

function drawArrow(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  metrics: ViewMetrics,
) {
  const begin = toScreenPoint(from, metrics);
  const end = toScreenPoint(to, metrics);
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2.2;
  context.beginPath();
  context.moveTo(begin.x, begin.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  drawArrowHead(context, begin, end, color);
  context.restore();
}

function drawArrowHead(context: CanvasRenderingContext2D, from: Point, to: Point, color: string) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const left = polar(to, 12, angle - Math.PI * 0.82);
  const right = polar(to, 12, angle + Math.PI * 0.82);
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(to.x, to.y);
  context.lineTo(left.x, left.y);
  context.lineTo(right.x, right.y);
  context.closePath();
  context.fill();
  context.restore();
}

function drawAtom(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  atom: EditorSnapshot['document']['page']['atoms'][number],
  metrics: ViewMetrics,
) {
  const neighbors = snapshot.document.page.bonds.filter((bond) =>
    bond.atomIds.includes(atom.id),
  ).length;
  const shouldShowCarbon =
    snapshot.viewport.showCarbonLabels ||
    atom.element !== 'C' ||
    atom.charge !== 0 ||
    atom.isotope !== null ||
    !!atom.alias ||
    neighbors === 0;

  if (!shouldShowCarbon) {
    return;
  }

  const screen = toScreenPoint(atom, metrics);
  const atomColor = resolveAtomColor(snapshot, atom.element, atom.color);
  const label = atom.alias ?? atom.element;
  const charge =
    atom.charge === 0
      ? ''
      : atom.charge > 0
        ? `${atom.charge === 1 ? '' : atom.charge}+`
        : `${Math.abs(atom.charge) === 1 ? '' : Math.abs(atom.charge)}-`;
  const isotope = atom.isotope ? `${atom.isotope}` : '';

  context.save();
  context.font = `${Math.max(13, snapshot.settings.fontSize * metrics.zoom * 0.7)}px ${snapshot.settings.fontFamily}`;
  const labelWidth = context.measureText(label).width;
  context.fillStyle = snapshot.document.page.background;
  context.fillRect(screen.x - labelWidth / 2 - 6, screen.y - 18, labelWidth + 12, 26);
  context.fillStyle = atomColor;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText(label, screen.x, screen.y);

  if (charge) {
    context.font = `${Math.max(10, snapshot.settings.fontSize * metrics.zoom * 0.45)}px ${snapshot.settings.fontFamily}`;
    context.fillText(charge, screen.x + labelWidth / 2 + 8, screen.y - 10);
  }

  if (isotope) {
    context.font = `${Math.max(9, snapshot.settings.fontSize * metrics.zoom * 0.4)}px ${snapshot.settings.fontFamily}`;
    context.fillText(isotope, screen.x - labelWidth / 2 - 8, screen.y - 10);
  }

  context.restore();
}

function drawHighlightedAtoms(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
  atomIds: string[],
  tone: 'selected' | 'hovered',
) {
  if (atomIds.length === 0) {
    return;
  }

  context.save();
  context.lineWidth = tone === 'selected' ? 2.4 : 1.8;
  context.strokeStyle =
    tone === 'selected' ? 'rgba(51, 193, 255, 0.92)' : 'rgba(51, 193, 255, 0.52)';
  context.fillStyle = tone === 'selected' ? 'rgba(51, 193, 255, 0.1)' : 'rgba(51, 193, 255, 0.05)';

  for (const atomId of [...new Set(atomIds)]) {
    const atom = findAtom(snapshot.document, atomId);
    if (!atom) {
      continue;
    }

    const screen = toScreenPoint(atom, metrics);
    const radius = Math.max(11, snapshot.settings.fontSize * metrics.zoom * 0.72);
    context.beginPath();
    context.arc(screen.x, screen.y - 5, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  context.restore();
}

function drawProtonOverlayLabels(
  context: CanvasRenderingContext2D,
  protonOverlayNodes: ProtonOverlayNode[],
) {
  if (protonOverlayNodes.length === 0) {
    return;
  }

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const node of protonOverlayNodes) {
    const fontSize = Math.max(10, node.height - 6);
    context.font = `${fontSize}px "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif`;
    drawOverlayBadge(context, node);
  }

  context.restore();
}

function buildProtonOverlayNodes(
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
  protonOverlayLabels: ProtonOverlayLabel[],
  selectedProtonAtomIds: string[],
  hoveredProtonAtomIds: string[],
) {
  if (protonOverlayLabels.length === 0) {
    return [];
  }

  const selectedKey =
    selectedProtonAtomIds.length > 0 ? normalizeOverlayAtomIds(selectedProtonAtomIds) : null;
  const hoveredKey =
    hoveredProtonAtomIds.length > 0 ? normalizeOverlayAtomIds(hoveredProtonAtomIds) : null;
  const labelsByAtomId = new Map<string, ProtonOverlayLabel[]>();

  for (const label of protonOverlayLabels) {
    const bucket = labelsByAtomId.get(label.hostAtomId);
    if (bucket) {
      bucket.push(label);
    } else {
      labelsByAtomId.set(label.hostAtomId, [label]);
    }
  }

  const nodes: ProtonOverlayNode[] = [];
  for (const [atomId, labels] of labelsByAtomId) {
    const atom = findAtom(snapshot.document, atomId);
    if (!atom) {
      continue;
    }

    const screen = toScreenPoint(atom, metrics);
    const direction = resolveOverlayDirection(snapshot.document, atom);
    const tangent = normalize(perpendicular(direction));
    const forwardOffset = 22;
    const laneSpacing = labels.length > 1 ? 16 : 0;
    const baseCenter = {
      x: screen.x + direction.x * forwardOffset,
      y: screen.y + direction.y * forwardOffset,
    };

    labels.forEach((label, index) => {
      const laneOffset = (index - (labels.length - 1) / 2) * laneSpacing;
      const center = {
        x: baseCenter.x + tangent.x * laneOffset,
        y: baseCenter.y + tangent.y * laneOffset,
      };
      const fontSize = Math.max(10, snapshot.settings.fontSize * metrics.zoom * 0.46);
      const width = Math.max(22, label.label.length * fontSize * 0.68 + 12);
      const height = 16;
      const atomKey = normalizeOverlayAtomIds(label.protonAtomIds);

      nodes.push({
        ...label,
        center,
        width,
        height,
        isHovered: hoveredKey === atomKey,
        isSelected: selectedKey === atomKey,
      });
    });
  }

  return nodes;
}

function drawPreview(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
  interaction: Interaction,
  hovered: HitResult | null,
  cursorDocPoint: Point | null,
) {
  if (!interaction) {
    if (snapshot.activeTool !== 'atom' || !cursorDocPoint) {
      return;
    }

    const selectedAnchorId = getSingleSelectedAtomId(snapshot);
    const selectedAnchor = selectedAnchorId ? findAtom(snapshot.document, selectedAnchorId) : null;
    const hoverPoint =
      hovered?.kind === 'bond'
        ? projectPointOnBond(snapshot.document, hovered.id, cursorDocPoint)
        : resolveHitPoint(snapshot, hovered);
    const previewPoint =
      hovered?.kind === 'atom'
        ? null
        : selectedAnchor && !hovered
          ? resolveBondEndpoint(
              snapshot,
              selectedAnchor,
              cursorDocPoint,
              snapshot.activeElement,
              snapshot.activeBondType,
            )
          : (hoverPoint ?? resolveSnap(cursorDocPoint, snapshot));

    if (!previewPoint) {
      return;
    }

    context.save();
    context.strokeStyle = 'rgba(17, 17, 17, 0.28)';
    context.fillStyle = 'rgba(17, 17, 17, 0.38)';
    context.lineWidth = 1.6;
    context.setLineDash([6, 4]);

    if (selectedAnchor && !hovered) {
      const begin = toScreenPoint(selectedAnchor, metrics);
      const end = toScreenPoint(previewPoint, metrics);
      context.beginPath();
      context.moveTo(begin.x, begin.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    drawAtomGhost(context, snapshot, previewPoint, snapshot.activeElement, metrics);
    context.restore();
    return;
  }

  context.save();
  context.strokeStyle = 'rgba(17, 17, 17, 0.45)';
  context.fillStyle = 'rgba(17, 17, 17, 0.16)';
  context.lineWidth = 2;
  context.setLineDash([7, 5]);

  if (interaction.mode === 'bond') {
    const start =
      interaction.startHit?.kind === 'atom'
        ? (findAtom(snapshot.document, interaction.startHit.id) ?? interaction.start)
        : interaction.start;
    const end = resolveBondEndpoint(
      snapshot,
      start,
      interaction.current,
      'C',
      snapshot.activeBondType,
    );
    if (!end) {
      context.restore();
      return;
    }
    const beginScreen = toScreenPoint(start, metrics);
    const endScreen = toScreenPoint(end, metrics);
    context.beginPath();
    context.moveTo(beginScreen.x, beginScreen.y);
    context.lineTo(endScreen.x, endScreen.y);
    context.stroke();
  }

  if (interaction.mode === 'chain') {
    const start =
      interaction.startHit?.kind === 'atom'
        ? (findAtom(snapshot.document, interaction.startHit.id) ?? interaction.start)
        : interaction.start;
    const segments = clamp(
      Math.round(distance(start, interaction.current) / snapshot.settings.bondLength),
      1,
      12,
    );
    const chain = buildConstrainedChain(snapshot.document, start, interaction.current, segments, {
      anchorAtomId: interaction.startHit?.kind === 'atom' ? interaction.startHit.id : null,
      fixedLength: snapshot.settings.fixedBondLength,
      bondLength: snapshot.settings.bondLength,
    });
    if (!chain.ok) {
      context.restore();
      return;
    }
    const points = chain.points;
    context.beginPath();
    points.forEach((point, index) => {
      const screen = toScreenPoint(point, metrics);
      if (index === 0) {
        context.moveTo(screen.x, screen.y);
      } else {
        context.lineTo(screen.x, screen.y);
      }
    });
    context.stroke();
  }

  if (interaction.mode === 'arrow') {
    drawArrow(context, interaction.start, interaction.current, 'rgba(17, 17, 17, 0.65)', metrics);
  }

  context.restore();
}

function drawAtomGhost(
  context: CanvasRenderingContext2D,
  snapshot: EditorSnapshot,
  point: Point,
  element: string,
  metrics: ViewMetrics,
) {
  const screen = toScreenPoint(point, metrics);
  const label = element;
  const color = resolveAtomColor(snapshot, element);

  context.save();
  context.font = `${Math.max(13, snapshot.settings.fontSize * metrics.zoom * 0.7)}px ${snapshot.settings.fontFamily}`;
  const labelWidth = context.measureText(label).width;
  context.fillStyle = 'rgba(247, 243, 234, 0.8)';
  context.fillRect(screen.x - labelWidth / 2 - 6, screen.y - 18, labelWidth + 12, 26);
  context.fillStyle = color;
  context.globalAlpha = 0.66;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText(label, screen.x, screen.y);
  context.restore();
}

function renderSelectionOverlay(snapshot: EditorSnapshot, metrics: ViewMetrics) {
  const bounds = selectionBounds(snapshot.document, snapshot.selectionIds);
  if (!bounds) {
    return null;
  }

  const topLeft = toScreenPoint({ x: bounds.minX, y: bounds.minY }, metrics);
  const bottomRight = toScreenPoint({ x: bounds.maxX, y: bounds.maxY }, metrics);
  const selectedAtoms = snapshot.selectionIds
    .map((selectionId) => findAtom(snapshot.document, selectionId))
    .filter(Boolean);
  const selectedBonds = snapshot.selectionIds
    .map((selectionId) => findBond(snapshot.document, selectionId))
    .filter(Boolean);
  const atomCircles = selectedAtoms.map((atom) => toScreenPoint(atom!, metrics));
  const showBounds =
    snapshot.selectionIds.length > 1 ||
    selectedBonds.length > 0 ||
    snapshot.selectionIds.some((selectionId) => !findAtom(snapshot.document, selectionId));

  return (
    <g>
      {showBounds ? (
        <rect
          x={topLeft.x - 16}
          y={topLeft.y - 18}
          width={Math.max(24, bottomRight.x - topLeft.x + 32)}
          height={Math.max(24, bottomRight.y - topLeft.y + 36)}
          className="selection-box"
        />
      ) : null}
      {selectedBonds.map((bond) => {
        const begin = findAtom(snapshot.document, bond!.atomIds[0]);
        const end = findAtom(snapshot.document, bond!.atomIds[1]);
        if (!begin || !end) {
          return null;
        }
        const beginScreen = toScreenPoint(begin, metrics);
        const endScreen = toScreenPoint(end, metrics);
        return (
          <line
            key={bond!.id}
            x1={beginScreen.x}
            y1={beginScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            className="selection-bond"
          />
        );
      })}
      {atomCircles.map((point, index) => (
        <circle
          key={`${point.x}_${point.y}_${index}`}
          cx={point.x}
          cy={point.y}
          r="11"
          className="selection-handle"
        />
      ))}
    </g>
  );
}

function renderHoverOverlay(
  snapshot: EditorSnapshot,
  metrics: ViewMetrics,
  hovered: HitResult | null,
) {
  if (!hovered) {
    return null;
  }

  if (hovered.kind === 'bond') {
    const bond = findBond(snapshot.document, hovered.id);
    if (!bond) {
      return null;
    }
    const begin = findAtom(snapshot.document, bond.atomIds[0]);
    const end = findAtom(snapshot.document, bond.atomIds[1]);
    if (!begin || !end) {
      return null;
    }
    const beginScreen = toScreenPoint(begin, metrics);
    const endScreen = toScreenPoint(end, metrics);
    return (
      <line
        x1={beginScreen.x}
        y1={beginScreen.y}
        x2={endScreen.x}
        y2={endScreen.y}
        className="hover-bond"
      />
    );
  }

  const point = resolveHitPoint(snapshot, hovered);
  if (!point) {
    return null;
  }
  const screen = toScreenPoint(point, metrics);
  return <circle cx={screen.x} cy={screen.y} r="10" className="hover-ring" />;
}

function resolveOverlayDirection(document: EditorSnapshot['document'], atom: AtomNode) {
  const neighbours = document.page.bonds
    .filter((bond) => bond.atomIds.includes(atom.id))
    .map((bond) =>
      findAtom(document, bond.atomIds[0] === atom.id ? bond.atomIds[1] : bond.atomIds[0]),
    )
    .filter((entry): entry is AtomNode => entry !== null);

  if (neighbours.length === 0) {
    return normalize({ x: 1, y: -1 });
  }

  const awayVector = neighbours.reduce(
    (vector, neighbour) => {
      const direction = normalize({
        x: neighbour.x - atom.x,
        y: neighbour.y - atom.y,
      });
      return {
        x: vector.x - direction.x,
        y: vector.y - direction.y,
      };
    },
    { x: 0, y: 0 },
  );

  if (Math.hypot(awayVector.x, awayVector.y) > 0.18) {
    return normalize(awayVector);
  }

  const firstNeighbour = neighbours[0];
  if (!firstNeighbour) {
    return normalize({ x: 1, y: -1 });
  }

  const bondDirection = normalize({
    x: firstNeighbour.x - atom.x,
    y: firstNeighbour.y - atom.y,
  });
  const fallback = perpendicular(bondDirection);
  return normalize(fallback.y > 0 ? { x: -fallback.x, y: -fallback.y } : fallback);
}

function drawOverlayBadge(context: CanvasRenderingContext2D, node: ProtonOverlayNode) {
  const radius = node.height / 2;
  const left = node.center.x - node.width / 2;
  const top = node.center.y - node.height / 2;

  context.beginPath();
  context.moveTo(left + radius, top);
  context.lineTo(left + node.width - radius, top);
  context.arcTo(left + node.width, top, left + node.width, top + radius, radius);
  context.lineTo(left + node.width, top + node.height - radius);
  context.arcTo(
    left + node.width,
    top + node.height,
    left + node.width - radius,
    top + node.height,
    radius,
  );
  context.lineTo(left + radius, top + node.height);
  context.arcTo(left, top + node.height, left, top + node.height - radius, radius);
  context.lineTo(left, top + radius);
  context.arcTo(left, top, left + radius, top, radius);
  context.closePath();
  context.fillStyle = node.isSelected
    ? 'rgba(51, 193, 255, 0.2)'
    : node.isHovered
      ? 'rgba(51, 193, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.96)';
  context.strokeStyle = node.isSelected
    ? 'rgba(51, 193, 255, 0.9)'
    : node.isHovered
      ? 'rgba(51, 193, 255, 0.6)'
      : 'rgba(15, 23, 42, 0.2)';
  context.lineWidth = 1;
  context.fill();
  context.stroke();

  context.fillStyle = node.isSelected || node.isHovered ? '#eef9ff' : '#0f172a';
  context.fillText(node.label, node.center.x, node.center.y + 0.5);
}

function hitProtonOverlay(nodes: ProtonOverlayNode[], screenPoint: Point) {
  return (
    nodes.find(
      (node) =>
        screenPoint.x >= node.center.x - node.width / 2 &&
        screenPoint.x <= node.center.x + node.width / 2 &&
        screenPoint.y >= node.center.y - node.height / 2 &&
        screenPoint.y <= node.center.y + node.height / 2,
    ) ?? null
  );
}

function normalizeOverlayAtomIds(atomIds: string[]) {
  return [...new Set(atomIds)].sort((left, right) => Number(left) - Number(right)).join('_');
}

function insideRect(point: Point, start: Point, end: Point) {
  return (
    point.x >= Math.min(start.x, end.x) &&
    point.x <= Math.max(start.x, end.x) &&
    point.y >= Math.min(start.y, end.y) &&
    point.y <= Math.max(start.y, end.y)
  );
}
