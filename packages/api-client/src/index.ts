export interface MolecularProperties {
  formula: string;
  molecular_weight: number;
  exact_mass: number;
  canonical_smiles: string;
  inchi: string;
  inchi_key: string;
}

export interface ConversionResult {
  output: string;
  input_format: string;
  output_format: string;
  success: boolean;
  error?: string;
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

  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<{ status: string }>;
  }
}
