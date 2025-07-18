export interface ParsedString {
  key: string;
  sourceValue: string;
  comment?: string;
  translations: {
    [language: string]: {
      value: string;
      status: TranslationStatus;
    };
  };
}

export type TranslationStatus = 'untranslated' | 'translated' | 'in-progress' | 'error' | 'non-translatable' | 'new';

export interface LanguageSummary {
  language: string;
  total: number;
  translated: number;
  untranslated: number;
  progress: number;
}

export interface StringEntry {
  comment?: string;
  extractionState?: string;
  localizations?: {
    [language: string]: {
      stringUnit: {
        state: 'translated' | 'new' | 'needs_review';
        value: string;
      };
      substitutions?: unknown;
    };
  };
}

export interface Xcstrings {
  sourceLanguage: string;
  strings: Record<string, StringEntry>;
  version: string;
}