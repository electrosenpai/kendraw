import aminoAcids from './amino-acids.json';
import commonDrugs from './common-drugs.json';
import sugars from './sugars.json';
import solvents from './solvents.json';
import nucleobases from './nucleobases.json';
import reagents from './reagents.json';
import protectingGroups from './protecting-groups.json';

export interface MoleculeTemplate {
  name: string;
  smiles: string;
  category: string;
  abbr3?: string;
  abbr1?: string;
}

export interface TemplateCategory {
  id: string;
  label: string;
  templates: MoleculeTemplate[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'amino-acids', label: 'Amino Acids', templates: aminoAcids as MoleculeTemplate[] },
  { id: 'drugs', label: 'Common Drugs', templates: commonDrugs as MoleculeTemplate[] },
  { id: 'sugars', label: 'Sugars', templates: sugars as MoleculeTemplate[] },
  { id: 'nucleobases', label: 'Nucleobases', templates: nucleobases as MoleculeTemplate[] },
  { id: 'reagents', label: 'Reagents', templates: reagents as MoleculeTemplate[] },
  {
    id: 'protecting-groups',
    label: 'Protecting Groups',
    templates: protectingGroups as MoleculeTemplate[],
  },
  { id: 'solvents', label: 'Solvents', templates: solvents as MoleculeTemplate[] },
];

export function searchTemplates(query: string): MoleculeTemplate[] {
  const q = query.toLowerCase();
  const results: MoleculeTemplate[] = [];
  for (const cat of TEMPLATE_CATEGORIES) {
    for (const t of cat.templates) {
      if (
        t.name.toLowerCase().includes(q) ||
        t.smiles.toLowerCase().includes(q) ||
        (t.abbr3 && t.abbr3.toLowerCase().includes(q)) ||
        (t.abbr1 && t.abbr1.toLowerCase() === q)
      ) {
        results.push(t);
      }
    }
  }
  return results;
}

export function getAllTemplates(): MoleculeTemplate[] {
  return TEMPLATE_CATEGORIES.flatMap((c) => c.templates);
}
