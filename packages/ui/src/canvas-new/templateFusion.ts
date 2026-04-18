// Wave-8 HF-D2 — Indigo-backed template fusion helper.
//
// Round-trips the current page atoms + bonds through the backend's
// /structure/fuse-template endpoint (Indigo merge + mapAtom + layout):
//
//   mode='atom' (target = atom index): vertex-share, e.g. terminal substituent
//   mode='bond' (target = bond index): edge-share, e.g. naphthalene from benzene
//
// On success the helper replaces the entire page (same model as
// cleanStructure). On any failure the caller can fall back to the local
// generator without partial state — nothing is dispatched.

import { parseMolV2000, writeMolV2000 } from '@kendraw/io';
import type { Atom, AtomId, Bond, BondId, Command } from '@kendraw/scene';

export type FuseMode = 'atom' | 'bond';

export interface FuseEndpointResponse {
  mol_block: string;
  success: boolean;
  error?: string | null;
}

export interface TemplateFusionContext {
  atoms: Atom[];
  bonds: Bond[];
  /** Target atom or bond id in the current page (the click hit target). */
  targetId: AtomId | BondId;
  mode: FuseMode;
  /** SMILES of the template to fuse onto the target. */
  templateSmiles: string;
  /** Optional anchor index override (defaults: atom→[0], bond→[0,1]). */
  templateAnchors?: readonly number[];
  dispatch(cmd: Command): void;
  /** Override the default /api base URL (for tests). */
  baseUrl?: string;
  /** Injected fetch — keeps unit tests hermetic. */
  fetchImpl?: typeof fetch;
}

export interface TemplateFusionResult {
  ok: boolean;
  reason?:
    | 'empty'
    | 'target-missing'
    | 'network'
    | 'engine'
    | 'parse'
    | 'noop';
  error?: string;
}

/** Map a page-id (uuid) to the positional index used inside writeMolV2000. */
function indexOfTarget(
  atoms: Atom[],
  bonds: Bond[],
  mode: FuseMode,
  id: AtomId | BondId,
): number {
  if (mode === 'atom') return atoms.findIndex((a) => a.id === id);
  return bonds.findIndex((b) => b.id === id);
}

export async function fuseTemplate(
  ctx: TemplateFusionContext,
): Promise<TemplateFusionResult> {
  if (ctx.atoms.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  const targetIndex = indexOfTarget(ctx.atoms, ctx.bonds, ctx.mode, ctx.targetId);
  if (targetIndex < 0) {
    return { ok: false, reason: 'target-missing' };
  }

  const molBlock = writeMolV2000(ctx.atoms, ctx.bonds);
  const baseUrl = ctx.baseUrl ?? '/api';
  const doFetch = ctx.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await doFetch(`${baseUrl}/structure/fuse-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mol_block: molBlock,
        template_smiles: ctx.templateSmiles,
        mode: ctx.mode,
        target_index: targetIndex,
        ...(ctx.templateAnchors ? { template_anchors: ctx.templateAnchors } : {}),
      }),
    });
  } catch (e) {
    return { ok: false, reason: 'network', error: String(e) };
  }
  if (!response.ok) {
    return { ok: false, reason: 'network', error: `HTTP ${response.status}` };
  }

  let payload: FuseEndpointResponse;
  try {
    payload = (await response.json()) as FuseEndpointResponse;
  } catch (e) {
    return { ok: false, reason: 'parse', error: String(e) };
  }
  if (!payload.success) {
    return { ok: false, reason: 'engine', error: payload.error ?? 'fuse failed' };
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

/** SMILES for ring template ids exposed by the toolbox. Used to drive the
 *  Indigo backend without the frontend having to ship a SMILES generator. */
export const RING_TEMPLATE_SMILES: Readonly<Record<string, string>> = {
  cyclopropane: 'C1CC1',
  cyclobutane: 'C1CCC1',
  cyclopentane: 'C1CCCC1',
  cyclohexane: 'C1CCCCC1',
  benzene: 'c1ccccc1',
  furan: 'c1ccoc1',
  pyridine: 'c1ccncc1',
  pyrrole: 'c1cc[nH]c1',
  thiophene: 'c1ccsc1',
  cycloheptane: 'C1CCCCCC1',
  cyclooctane: 'C1CCCCCCC1',
  cyclononane: 'C1CCCCCCCC1',
  cyclodecane: 'C1CCCCCCCCC1',
  cyclopentadiene: 'C1=CC=CC1',
};
