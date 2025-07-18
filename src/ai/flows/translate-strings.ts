'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { translateMultipleLanguages } from '@/lib/openai-translator';

const TranslateBatchInputSchema = z.object({
  batches: z.array(z.object({
    language: z.string(),
    requests: z.array(z.object({
      key: z.string(),
      text: z.string(),
    })),
  })).describe('Array of translation batches, each containing requests for a specific language.'),
  sourceLanguage: z.string().describe('The source language of the texts.'),
  apiKey: z.string().describe('The API key for the translation service.'),
  model: z.string().optional().describe('The model to use for translation.'),
  appContext: z.string().optional().describe('Optional application context for translation.'),
});
export type TranslateBatchInput = z.infer<typeof TranslateBatchInputSchema>;

const TranslateBatchOutputSchema = z.object({
  results: z.array(z.object({
    language: z.string(),
    results: z.array(z.object({
      key: z.string(),
      translatedText: z.string(),
      error: z.string().optional(),
    })),
    completed: z.number(),
    failed: z.number(),
  })).describe('Array of translation results for each language batch.'),
});
export type TranslateBatchOutput = z.infer<typeof TranslateBatchOutputSchema>;

export async function translateBatch(input: TranslateBatchInput): Promise<TranslateBatchOutput> {
  return translateBatchFlow(input);
}

const translateBatchFlow = ai.defineFlow(
  {
    name: 'translateBatchFlow',
    inputSchema: TranslateBatchInputSchema,
    outputSchema: TranslateBatchOutputSchema,
  },
  async (input) => {
    const { batches, sourceLanguage, apiKey, model, appContext } = input;

    const results = await translateMultipleLanguages(
      batches,
      sourceLanguage,
      apiKey,
      { model, appContext }
    );

    return { results };
  }
);
