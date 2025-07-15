'use server';

import { translateBatch, TranslationRequest, TranslationResult } from '@/lib/openai-translator';

export async function translateStringsAction(
  stringsToTranslate: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string,
  model: string,
  apiKey: string,
  appContext?: string,
): Promise<TranslationResult[]> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  try {
    const results = await translateBatch(
      stringsToTranslate,
      sourceLanguage,
      targetLanguage,
      apiKey,
      { model, appContext }
    );
    
    return results;
  } catch (error) {
    console.error('Translation batch failed:', error);
    throw error;
  }
}
