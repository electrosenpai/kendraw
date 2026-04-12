# STORY-001: @kendraw/scene — types de base + SceneStore (subscribe/dispatch)

**Epic:** EPIC-001 (Core Drawing Engine)
**Priority:** Must Have
**Story Points:** 2
**Status:** Not Started
**Assigned To:** Jean-Baptiste Donnette
**Created:** 2026-04-12
**Sprint:** 1

---

## User Story

As a **Kendraw package consumer** (renderer, persistence, io, ui)
I want to **compile against a stable scene model contract with a reactive store**
So that **all packages share one source of truth for document state**

---

## Description

### Background

Sprint 1 delivers the first vertical slice: click canvas, atom appears. This story lays the foundation — the scene model types and the reactive store that every other package depends on. Without this contract, renderer-canvas, persistence, and ui cannot compile.

### Scope

**In scope:**

- All TypeScript types from architecture doc §6.1: `Document`, `Page`, `Atom`, `Bond`, `Arrow`, `Annotation`, `Group`, `Viewport`, `Point`, `BezierGeometry`, `ArrowAnchor`, `DocumentMetadata`, branded ID types
- `SceneStore` interface: `getState()`, `subscribe(listener)`, `dispatch(command)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`
- `createSceneStore(initialDoc?: Document): SceneStore` factory
- `SceneDiff` type (minimal, for subscriber notifications)
- Vitest unit tests

**Out of scope:**

- Immer structural sharing (STORY-002)
- Command implementations (STORY-002)
- Spatial index / R-tree (Sprint 3)
- Serialization `.kdx` (Sprint 2)
- `hitTest()` method (Sprint 3)

---

## Acceptance Criteria

- [ ] Types TS in `packages/scene/src/types.ts`: `Document`, `DocumentMetadata`, `Page`, `Atom`, `Bond`, `Arrow`, `Annotation`, `Group`, `Viewport`, `Point`, `BezierGeometry`, `ArrowAnchor`, branded ID types (`AtomId`, `BondId`, `ArrowId`, `AnnotationId`, `GroupId`)
- [ ] `SceneStore` interface in `packages/scene/src/store.ts` with `getState()`, `subscribe(listener)`, `dispatch(command)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`
- [ ] `createSceneStore(initialDoc?: Document): SceneStore` factory implementation
- [ ] `dispatch()` accepts a `Command` (discriminated union type stub) and notifies subscribers
- [ ] `undo()` / `redo()` throw `NotImplementedError` (implemented in Sprint 3)
- [ ] `subscribe()` returns an unsubscribe function; calling it removes the listener
- [ ] All types exported from `packages/scene/src/index.ts`
- [ ] Vitest tests: initial state returns valid empty document, subscribe/unsubscribe works, dispatch notifies listeners
- [ ] `pnpm --filter @kendraw/scene typecheck` passes
- [ ] `pnpm --filter @kendraw/scene test` passes
- [ ] No Immer dependency yet (plain object spread or structuredClone)

---

## Technical Notes

### Components

- **Package:** `packages/scene/`
- **Files to create:**
  - `src/types.ts` — all scene model types per §6.1 architecture
  - `src/store.ts` — `SceneStore` interface + `createSceneStore` factory
  - `src/commands.ts` — `Command` discriminated union stub (empty for now, expanded in STORY-002)
  - `src/errors.ts` — `NotImplementedError`
  - `src/index.ts` — barrel exports
  - `src/__tests__/store.test.ts` — unit tests

### Key Design Decisions

- `Record<Id, Entity>` for atoms/bonds/etc (O(1) lookups, per architecture §6.1)
- Branded types for IDs (`type AtomId = string & { readonly __brand: 'AtomId' }`) for type safety
- No Immer yet — `dispatch` can use spread/structuredClone for now
- UUID v4 for IDs via `crypto.randomUUID()` (native, no external dep)
- Framework-agnostic: zero React, zero DOM dependencies

### Edge Cases

- `subscribe()` then immediate `unsubscribe()` — listener must not fire
- Multiple subscribers — all notified on dispatch
- `getState()` before any dispatch — returns valid empty document
- `dispatch()` with no subscribers — no error

---

## Dependencies

**Prerequisite:**

- Sprint 0 gate passed (POC #1 and #2 green)

**Blocks:**

- STORY-002 (command bus builds on this store)
- STORY-003 (renderer reads Document type)
- STORY-004 (UI wires store + renderer)

**External Dependencies:**

- None (pure TypeScript, zero external deps)

---

## Definition of Done

- [ ] All acceptance criteria validated
- [ ] `pnpm --filter @kendraw/scene typecheck` passes
- [ ] `pnpm --filter @kendraw/scene test` passes — all tests green
- [ ] Types match architecture doc §6.1 faithfully
- [ ] Exported API is clean (no internal leaks)
- [ ] Committed to main branch

---

## Story Points Breakdown

- **Types:** 1 point (transcribe §6.1 + branded IDs)
- **Store + tests:** 1 point (simple reactive store pattern)
- **Total:** 2 points

**Rationale:** Straightforward transcription of well-specified types from architecture doc, plus a simple pub/sub store. No complex logic, no external dependencies.

---

## Progress Tracking

**Status History:**

- 2026-04-12: Created

**Actual Effort:** TBD
