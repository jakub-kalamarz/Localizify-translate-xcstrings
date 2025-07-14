import type { ParsedString, StringEntry } from '@/types';

export function parseXcstrings(
  jsonData: any,
  targetLanguage: string
): { parsedData: ParsedString[]; languages: string[]; sourceLanguage: string } {
  const sourceLanguage = jsonData.sourceLanguage || 'en';
  const strings = jsonData.strings || {};
  const languages = new Set<string>();
  languages.add(sourceLanguage);

  const parsedData: ParsedString[] = Object.entries(strings).map(([key, value]) => {
    const entry = value as StringEntry;
    const localizations = entry.localizations || {};
    
    Object.keys(localizations).forEach(lang => languages.add(lang));

    const sourceLocalization = localizations[sourceLanguage]?.stringUnit;
    const targetLocalization = localizations[targetLanguage]?.stringUnit;

    const getStatus = () => {
      if (!targetLocalization) return 'new';
      if (targetLocalization.state === 'translated' && targetLocalization.value) return 'translated';
      return 'untranslated';
    }

    return {
      key,
      sourceValue: sourceLocalization?.value || entry.comment || key,
      targetValue: targetLocalization?.value || '',
      status: getStatus(),
    };
  });

  return { parsedData, languages: Array.from(languages).sort(), sourceLanguage };
}
