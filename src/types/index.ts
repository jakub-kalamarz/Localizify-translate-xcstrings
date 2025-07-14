// types for xcstrings JSON format
export interface Xcstrings {
  sourceLanguage: string;
  strings: { [key: string]: StringEntry };
  version: string;
}

export interface StringEntry {
  comment?: string;
  extractionState?: string;
  localizations?: { [lang: string]: LocalizationDetail };
}

export interface LocalizationDetail {
  stringUnit: {
    state: 'translated' | 'new' | 'needs_review';
    value: string;
  };
  substitutions?: any;
}

// type for our internal representation
export type TranslationStatus = 'new' | 'translated' | 'in-progress' | 'error' | 'untranslated';

export interface ParsedString {
  key: string;
  sourceValue: string;
  targetValue: string;
  status: TranslationStatus;
}
