export { parseMolV2000, writeMolV2000, type ParsedMol } from './mol-v2000.js';
export { serializeKdx, deserializeKdx } from './kdx-serializer.js';

export {
  searchByName,
  searchBySmiles,
  searchByFormula,
  autocomplete,
  getSDF,
  type PubChemCompound,
  type PubChemSearchResult,
} from './pubchem/pubchem-client.js';

export {
  TEMPLATE_CATEGORIES,
  searchTemplates,
  getAllTemplates,
  type MoleculeTemplate,
  type TemplateCategory,
} from './templates/template-library.js';

export { parseSmiles, type SmilesParseResult } from './smiles-parser.js';

export {
  parseTextClipboard,
  type ClipboardKind,
  type ClipboardParseResult,
} from './clipboard-sniffer.js';

export {
  parseCdxml,
  type CdxmlParseResult,
  type CdxmlDocumentSettings,
  type CdxmlGraphic,
} from './cdxml-parser.js';
