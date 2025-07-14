'use server';

import { translateString } from '@/ai/flows/translate-strings';

interface TranslationRequest {
    key: string;
    text: string;
}

interface TranslationResult {
  key: string;
  translatedText: string;
  error?: string;
}

export async function translateStringsAction(
  stringsToTranslate: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string,
  model?: string,
): Promise<TranslationResult[]> {
  const translations = await Promise.all(
    stringsToTranslate.map(async (str) => {
      try {
        if (!str.text) {
           return { key: str.key, translatedText: '', error: 'Source text is empty.' };
        }
        const result = await translateString({
          text: str.text,
          sourceLanguage,
          targetLanguage,
          model,
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
