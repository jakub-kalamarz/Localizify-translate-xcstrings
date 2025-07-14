import type { ParsedString, StringEntry, LanguageTranslation } from '@/types';

export function parseXcstrings(
  jsonData: any
): { parsedData: ParsedString[]; languages: string[]; sourceLanguage: string } {
  const sourceLanguage = jsonData.sourceLanguage || 'en';
  const strings = jsonData.strings || {};
  
  // First pass: collect all languages
  const languages = new Set<string>();
  languages.add(sourceLanguage);
  Object.values(strings).forEach((value) => {
    const entry = value as StringEntry;
    if (entry.localizations) {
      Object.keys(entry.localizations).forEach(lang => languages.add(lang));
    }
  });
  const allLangs = Array.from(languages).sort();
  const targetLanguages = allLangs.filter(l => l !== sourceLanguage);

  // Second pass: build the full ParsedString object for each key
  const parsedData: ParsedString[] = Object.entries(strings).map(([key, value]) => {
    const entry = value as StringEntry;
    const translations: Record<string, LanguageTranslation> = {};
    
    targetLanguages.forEach(lang => {
      const localization = entry.localizations?.[lang]?.stringUnit;
      
      let status: LanguageTranslation['status'] = 'new';
      if(localization) {
          status = (localization.state === 'translated' && localization.value) ? 'translated' : 'untranslated';
      }

      translations[lang] = {
        value: localization?.value || '',
        status: status,
      };
    });

    return {
      key,
      comment: entry.comment || '',
      sourceValue: entry.localizations?.[sourceLanguage]?.stringUnit?.value || key,
      translations,
    };
  });

  return { parsedData, languages: allLangs, sourceLanguage };
}
