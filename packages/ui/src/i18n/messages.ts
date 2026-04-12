export type LocaleId = 'en' | 'fr';

export interface Messages {
  'app.title': string;
  'tool.select': string;
  'tool.atom': string;
  'tool.eraser': string;
  'tool.pan': string;
  'panel.properties': string;
  'panel.formula': string;
  'panel.mw': string;
  'panel.atoms': string;
  'panel.bonds': string;
  'about.title': string;
  'about.cite': string;
  'about.close': string;
  'tab.new': string;
  'shortcuts.title': string;
  'status.backend.available': string;
  'status.backend.unavailable': string;
}

const EN: Messages = {
  'app.title': 'Kendraw',
  'tool.select': 'Select',
  'tool.atom': 'Atom',
  'tool.eraser': 'Eraser',
  'tool.pan': 'Pan',
  'panel.properties': 'Properties',
  'panel.formula': 'Formula',
  'panel.mw': 'MW',
  'panel.atoms': 'Atoms',
  'panel.bonds': 'Bonds',
  'about.title': 'Kendraw v0.1.0',
  'about.cite': 'Cite this work',
  'about.close': 'Close',
  'tab.new': 'New document',
  'shortcuts.title': 'Keyboard Shortcuts',
  'status.backend.available': 'Backend connected',
  'status.backend.unavailable': 'Static demo mode',
};

const FR: Messages = {
  'app.title': 'Kendraw',
  'tool.select': 'Sélection',
  'tool.atom': 'Atome',
  'tool.eraser': 'Gomme',
  'tool.pan': 'Déplacer',
  'panel.properties': 'Propriétés',
  'panel.formula': 'Formule',
  'panel.mw': 'MM',
  'panel.atoms': 'Atomes',
  'panel.bonds': 'Liaisons',
  'about.title': 'Kendraw v0.1.0',
  'about.cite': 'Citer ce travail',
  'about.close': 'Fermer',
  'tab.new': 'Nouveau document',
  'shortcuts.title': 'Raccourcis clavier',
  'status.backend.available': 'Backend connecté',
  'status.backend.unavailable': 'Mode démo statique',
};

const LOCALES: Record<LocaleId, Messages> = { en: EN, fr: FR };

let currentLocale: LocaleId = 'en';

export function setLocale(locale: LocaleId): void {
  currentLocale = locale;
}

export function t(key: keyof Messages): string {
  return LOCALES[currentLocale][key];
}

export function getLocale(): LocaleId {
  return currentLocale;
}
