'use server';

import { translateString } from '@/ai/flows/translate-strings';
import type { ParsedString } from '@/types';

interface TranslationResult {
  key: string;
  translatedText: string;
  error?: string;
}

export async function translateStringsAction(
  stringsToTranslate: ParsedString[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult[]> {
  const translations = await Promise.all(
    stringsToTranslate.map(async (str) => {
      try {
        if (!str.sourceValue) {
           return { key: str.key, translatedText: '', error: 'Source text is empty.' };
        }
        const result = await translateString({
          text: str.sourceValue,
          sourceLanguage,
          targetLanguage,
        });
        return { key: str.key, translatedText: result.translatedText };
      } catch (error) {
        console.error(`Translation failed for key "${str.key}":`, error);
        return { key: str.key, translatedText: '', error: 'Translation failed' };
      }
    })
  );

  return translations;
}
