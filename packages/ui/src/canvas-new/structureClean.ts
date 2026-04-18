// Wave-7 HF-3 — structure cleanup / refinement helper.
//
// Round-trips the current page's atoms + bonds through the backend's
// /structure/clean endpoint:
//
//   mode='quick'  → RDKit sanitize, preserves user layout.
//   mode='full'   → RDKit Compute2DCoords, recomputes 2D layout.
//
// Atoms and bonds outside the MOL V2000 schema (arrows, annotations,
// shapes, selection state) are untouched. On any failure the page is
// left unchanged.

import { parseMolV2000, writeMolV2000 } from '@kendraw/io';
import type { Atom, AtomId, Bond, BondId, Command } from '@kendraw/scene';

export type CleanMode = 'quick' | 'full';

export interface CleanEndpointResponse {
  mol_block: string;
  mode: CleanMode;
  success: boolean;
  changed?: boolean;
  error?: string | null;
}

export interface CleanStructureContext {
  atoms: Atom[];
  bonds: Bond[];
  dispatch(cmd: Command): void;
  /** Override the default /api base URL (for tests). */
  baseUrl?: string;
  /** Injected fetch — keeps unit tests hermetic. */
  fetchImpl?: typeof fetch;
}

export interface CleanStructureResult {
  ok: boolean;
  reason?: 'empty' | 'network' | 'rdkit' | 'parse' | 'noop';
  error?: string;
}

export async function cleanStructure(
  ctx: CleanStructureContext,
  mode: CleanMode,
): Promise<CleanStructureResult> {
  if (ctx.atoms.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const molBlock = writeMolV2000(ctx.atoms, ctx.bonds);
  const baseUrl = ctx.baseUrl ?? '/api';
  const doFetch = ctx.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await doFetch(`${baseUrl}/structure/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mol_block: molBlock, mode }),
    });
  } catch (e) {
    return { ok: false, reason: 'network', error: String(e) };
  }
  if (!response.ok) {
    return { ok: false, reason: 'network', error: `HTTP ${response.status}` };
  }

  let payload: CleanEndpointResponse;
  try {
    payload = (await response.json()) as CleanEndpointResponse;
  } catch (e) {
    return { ok: false, reason: 'parse', error: String(e) };
  }
  if (!payload.success) {
    return { ok: false, reason: 'rdkit', error: payload.error ?? 'clean failed' };
  }

  let parsed: { atoms: Atom[]; bonds: Bond[] };
  try {
    parsed = parseMolV2000(payload.mol_block);
  } catch (e) {
    return { ok: false, reason: 'parse', error: String(e) };
  }
  if (parsed.atoms.length === 0) {
    return { ok: false, reason: 'noop' };
  }

  const atomIds: AtomId[] = ctx.atoms.map((a) => a.id);
  const bondIds: BondId[] = ctx.bonds.map((b) => b.id);
  ctx.dispatch({ type: 'remove-batch', atomIds, bondIds });
  for (const atom of parsed.atoms) ctx.dispatch({ type: 'add-atom', atom });
  for (const bond of parsed.bonds) ctx.dispatch({ type: 'add-bond', bond });
  return { ok: true };
}
