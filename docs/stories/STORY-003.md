# STORY-003: @kendraw/renderer-canvas minimal — render atomes

**Epic:** EPIC-001 (Core Drawing Engine)
**Priority:** Must Have
**Story Points:** 3
**Status:** Not Started
**Assigned To:** Jean-Baptiste Donnette
**Created:** 2026-04-12
**Sprint:** 1

---

## User Story

As a **Kendraw user**
I want to **see atoms rendered on a canvas**
So that **I get visual feedback of the molecules I'm building**

---

## Description

### Background

This story implements the minimal Canvas 2D renderer that reads the scene Document and paints atoms. It's the visual layer that connects the data model (STORY-001/002) to what the user sees. For Sprint 1 we only render atoms — no bonds, no layers, no dirty regions.

### Scope

**In scope:**
- `CanvasRenderer` class implementing `Renderer` interface
- `attach(container)` — creates `<canvas>`, handles DPR
- `render(doc)` — full repaint of all atoms on active page
- CPK color palette (C=black, H=white, O=red, N=blue, S=yellow, P=orange, fallback=gray)
- Element label text centered on atom position
- `detach()` cleanup
- Vitest tests with jsdom (canvas mocking)

**Out of scope:**
- Bonds rendering (Sprint 2)
- Dirty regions / layer cache (future optimization)
- Spatial index hit testing (Sprint 3)
- Grid rendering (Sprint 5)

---

## Acceptance Criteria

- [ ] `CanvasRenderer` class in `packages/renderer-canvas/src/renderer.ts` implements `Renderer` interface
- [ ] `attach(container: HTMLElement)` creates a `<canvas>` element, appends to container, sets up DPR scaling
- [ ] `render(doc: Document)` full-repaints all atoms of the active page
- [ ] Each atom rendered as: filled circle (CPK color) + element label text centered
- [ ] CPK palette: C=#333333, H=#ffffff, O=#ff0000, N=#3050f8, S=#ffff30, P=#ff8000, default=#808080
- [ ] `detach()` removes canvas from DOM and cleans up
- [ ] No bonds rendering in this story
- [ ] Vitest tests: render 0 atoms, 1 atom, 100 atoms without throwing
- [ ] `pnpm --filter @kendraw/renderer-canvas typecheck` passes
- [ ] `pnpm --filter @kendraw/renderer-canvas test` passes

---

## Dependencies

**Prerequisite:** STORY-001 (Document/Atom types)
**Blocks:** STORY-004 (UI wires renderer)
**Package dependency:** `@kendraw/scene` (for types only)

---

## Definition of Done

- [ ] All acceptance criteria validated
- [ ] Typecheck and tests green
- [ ] @kendraw/scene added as workspace dependency
- [ ] Committed and pushed
