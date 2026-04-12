const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const AUTO = 'https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound';

export interface PubChemCompound {
  cid: number;
  name: string;
  formula: string;
  mw: number;
  smiles: string;
}

export interface PubChemSearchResult {
  compounds: PubChemCompound[];
  total: number;
}

export async function searchByName(name: string): Promise<PubChemSearchResult> {
  const url = `${BASE}/compound/name/${encodeURIComponent(name)}/JSON`;
  return fetchCompounds(url);
}

export async function searchBySmiles(smiles: string): Promise<PubChemSearchResult> {
  const url = `${BASE}/compound/smiles/${encodeURIComponent(smiles)}/JSON`;
  return fetchCompounds(url);
}

export async function searchByFormula(formula: string): Promise<PubChemSearchResult> {
  const url = `${BASE}/compound/fastformula/${encodeURIComponent(formula)}/JSON?MaxRecords=10`;
  return fetchCompounds(url);
}

export async function autocomplete(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  const url = `${AUTO}/${encodeURIComponent(query)}/JSON?limit=8`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { dictionary_terms?: { compound?: string[] } };
    return data.dictionary_terms?.compound ?? [];
  } catch {
    return [];
  }
}

export async function getSDF(cid: number): Promise<string> {
  const url = `${BASE}/compound/cid/${cid}/SDF`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`PubChem SDF fetch failed: ${res.status}`);
  return res.text();
}

async function fetchCompounds(url: string): Promise<PubChemSearchResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { compounds: [], total: 0 };
    const data = (await res.json()) as {
      PC_Compounds?: Array<{
        id?: { id?: { cid?: number } };
        props?: Array<{
          urn?: { label?: string; name?: string };
          value?: { sval?: string; fval?: number };
        }>;
      }>;
    };
    const raw = data.PC_Compounds ?? [];
    const compounds: PubChemCompound[] = raw.map((c) => {
      const cid = c.id?.id?.cid ?? 0;
      const props = c.props ?? [];
      const getProp = (label: string, name?: string) =>
        props.find((p) => p.urn?.label === label && (!name || p.urn?.name === name));
      return {
        cid,
        name: getProp('IUPAC Name', 'Preferred')?.value?.sval ?? '',
        formula: getProp('Molecular Formula')?.value?.sval ?? '',
        mw: getProp('Molecular Weight')?.value?.fval ?? 0,
        smiles: getProp('SMILES', 'Canonical')?.value?.sval ?? '',
      };
    });
    return { compounds, total: compounds.length };
  } catch {
    return { compounds: [], total: 0 };
  }
}
