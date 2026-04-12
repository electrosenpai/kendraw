# STORY-002: @kendraw/scene — Command bus + AddAtom + RemoveAtom

**Epic:** EPIC-001 (Core Drawing Engine)
**Priority:** Must Have
**Story Points:** 2
**Status:** Not Started
**Assigned To:** Jean-Baptiste Donnette
**Created:** 2026-04-12
**Sprint:** 1

---

## User Story

As a **Kendraw UI developer**
I want to **add and remove atoms via the command bus with Immer structural sharing**
So that **the scene model updates immutably and efficiently notifies subscribers of precise diffs**

---

## Description

### Background

STORY-001 laid the foundation with types and a reactive store. This story wires in the command bus pattern with Immer for structural sharing, and implements the first two concrete commands: AddAtom and RemoveAtom. This enables STORY-004 (UI) to dispatch atom placement on canvas click.

### Scope

**In scope:**

- `AddAtomCommand` and `RemoveAtomCommand` discriminated union types
- `applyCommand(state, cmd)` reducer using Immer `produce`
- Store `dispatch()` applies command, emits SceneDiff to listeners
- History stack (push on dispatch) — undo/redo still throws NotImplementedError
- UUID v4 for atom IDs via `crypto.randomUUID()`
- Vitest tests: add/remove/multiple add/structural sharing

**Out of scope:**

- Undo/redo execution (Sprint 3)
- Bonds, arrows, annotations commands (future sprints)
- Spatial index (Sprint 3)

---

## Acceptance Criteria

- [ ] `AddAtomCommand` type: `{ type: 'add-atom'; atom: Atom }`
- [ ] `RemoveAtomCommand` type: `{ type: 'remove-atom'; id: AtomId }`
- [ ] `Command` union = `AddAtomCommand | RemoveAtomCommand`
- [ ] `applyCommand(state, cmd)` uses Immer `produce` for structural sharing
- [ ] `dispatch()` applies command and emits `SceneDiff` with `{ type: 'atom-added', id }` or `{ type: 'atom-removed', id }`
- [ ] History stack records dispatched commands (no undo execution yet)
- [ ] Tests: add atom -> state contains atom
- [ ] Tests: remove atom -> state doesn't contain it
- [ ] Tests: multiple add -> all present
- [ ] Tests: structural sharing (prev !== next but prev.metadata === next.metadata)
- [ ] `pnpm --filter @kendraw/scene typecheck` passes
- [ ] `pnpm --filter @kendraw/scene test` passes

---

## Dependencies

**Prerequisite:** STORY-001 (scene types + store)
**Blocks:** STORY-004 (UI dispatches AddAtomCommand)
**New dependency:** `immer` package

---

## Definition of Done

- [ ] All acceptance criteria validated
- [ ] Typecheck and tests green
- [ ] Immer added as dependency to @kendraw/scene
- [ ] Committed and pushed
