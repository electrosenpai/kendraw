# STORY-004: @kendraw/ui shell + tool controller AddAtom

**Epic:** EPIC-001 (Core Drawing Engine) + EPIC-004 (UI Shell)
**Priority:** Must Have
**Story Points:** 3
**Status:** Not Started
**Assigned To:** Jean-Baptiste Donnette
**Created:** 2026-04-12
**Sprint:** 1

---

## User Story

As a **Kendraw user**
I want to **click on the canvas and see a carbon atom appear at the click position**
So that **I can start building molecules visually**

---

## Description

### Background

This is the capstone story of Sprint 1 — the first end-to-end vertical slice. It wires together SceneStore (STORY-001), command bus (STORY-002), and CanvasRenderer (STORY-003) into a working React app. The user sees a full-screen dark canvas. Click anywhere, a carbon atom appears.

### Scope

**In scope:**

- Minimal React app in `packages/ui/src/App.tsx`
- `<Canvas>` component: full-screen, dark background
- Instantiate SceneStore + CanvasRenderer, wire together
- `useSyncExternalStore` for React integration
- onClick dispatches `AddAtomCommand` at click coords (carbon, Z=6)
- `pnpm dev` serves on localhost:5173
- E2E Playwright test: click 3 times, verify atoms rendered

**Out of scope:**

- Element palette / tool switching
- Property panel
- Multi-tab / multi-document
- Keyboard shortcuts

---

## Acceptance Criteria

- [ ] `App.tsx`: single `<Canvas>` component, full-screen, dark background (#0a0a0a)
- [ ] `<Canvas>` creates SceneStore and CanvasRenderer, wires them via useSyncExternalStore
- [ ] Click on canvas dispatches AddAtomCommand with click coordinates and element=6 (carbon)
- [ ] Atom appears visually at click position after each click
- [ ] `pnpm dev` works and opens http://localhost:5173
- [ ] E2E Playwright test: goto / click 3 times / verify store has 3 atoms
- [ ] `pnpm --filter @kendraw/ui typecheck` passes
- [ ] All tests pass

---

## Dependencies

**Prerequisites:** STORY-001, STORY-002, STORY-003
**Package dependencies:** `@kendraw/scene`, `@kendraw/renderer-canvas`

---

## Definition of Done

- [ ] All acceptance criteria validated
- [ ] Typecheck and tests green
- [ ] Dev server works, atoms appear on click
- [ ] Committed and pushed
