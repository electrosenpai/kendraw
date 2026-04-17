export interface MolecularProperties {
  formula: string;
  molecular_weight: number;
  exact_mass: number;
  canonical_smiles: string;
  inchi: string;
  inchi_key: string;
  logp: number | null;
  tpsa: number | null;
  hbd: number | null;
  hba: number | null;
  rotatable_bonds: number | null;
  lipinski_pass: boolean | null;
}

export interface ConversionResult {
  output: string;
  input_format: string;
  output_format: string;
  success: boolean;
  error?: string;
}

export interface NmrPeak {
  atom_index: number;
  atom_indices: number[];
  parent_indices: number[];
  shift_ppm: number;
  sigma_ppm?: number | null;
  integral: number;
  multiplicity: string;
  coupling_hz: number[];
  environment: string;
  confidence: 1 | 2 | 3;
  method: string;
  proton_group_id: number;
  dept_class: string | null;
  d2o_exchangeable?: boolean;
}

export interface NmrMetadata {
  engine_version: string;
  data_version: string | null;
  method: string;
  schema_version?: string;
}

export interface NmrPrediction {
  nucleus: string;
  solvent: string;
  peaks: NmrPeak[];
  metadata: NmrMetadata;
}

export class KendrawApiClient {
  constructor(private baseUrl: string = 'http://localhost:8081') {}

  async computeFromSmiles(smiles: string): Promise<MolecularProperties> {
    const res = await fetch(`${this.baseUrl}/compute/properties/smiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<MolecularProperties>;
  }

  async convert(
    inputData: string,
    inputFormat: string,
    outputFormat: string,
  ): Promise<ConversionResult> {
    const res = await fetch(`${this.baseUrl}/convert/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_data: inputData,
        input_format: inputFormat,
        output_format: outputFormat,
      }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<ConversionResult>;
  }

  async predictNmr(
    input: string,
    format: string = 'smiles',
    nucleus: string = '1H',
    solvent: string = 'CDCl3',
  ): Promise<NmrPrediction> {
    const res = await fetch(`${this.baseUrl}/compute/nmr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, format, nucleus, solvent }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `API error: ${res.status}` }));
      throw new Error(err.detail ?? `API error: ${res.status}`);
    }
    return res.json() as Promise<NmrPrediction>;
  }

  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ status: string }>;
  }
}
