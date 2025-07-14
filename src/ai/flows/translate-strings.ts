'use server';
/**
 * @fileOverview A translation AI agent that translates a string from one language to another.
 *
 * - translateString - A function that handles the string translation process.
 * - TranslateStringInput - The input type for the translateString function.
 * - TranslateStringOutput - The return type for the translateString function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ModelReference } from 'genkit/model';
import { gemini15Flash } from '@genkit-ai/googleai';

const allModels = {
    'gemini-1.5-flash': gemini15Flash
}

const TranslateStringInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  sourceLanguage: z.string().describe('The source language of the text.'),
  targetLanguage: z.string().describe('The target language to translate to.'),
  model: z.string().optional().describe('The model to use for translation.'),
});
export type TranslateStringInput = z.infer<typeof TranslateStringInputSchema>;

const TranslateStringOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateStringOutput = z.infer<typeof TranslateStringOutputSchema>;

export async function translateString(input: TranslateStringInput): Promise<TranslateStringOutput> {
  return translateStringFlow(input);
}

const translateStringPrompt = ai.definePrompt({
  name: 'translateStringPrompt',
  input: {schema: z.object({
    text: TranslateStringInputSchema.shape.text,
    sourceLanguage: TranslateStringInputSchema.shape.sourceLanguage,
    targetLanguage: TranslateStringInputSchema.shape.targetLanguage,
  })},
  output: {schema: TranslateStringOutputSchema},
  prompt: `You are a professional translator.
Translate the following text from {{sourceLanguage}} to {{targetLanguage}}:

{{text}}`,
});

const translateStringFlow = ai.defineFlow(
  {
    name: 'translateStringFlow',
    inputSchema: TranslateStringInputSchema,
    outputSchema: TranslateStringOutputSchema,
  },
  async input => {
    const { model, ...promptInput } = input;
    const selectedModel = model ? allModels[model as keyof typeof allModels] : gemini15Flash;
    
    const {output} = await ai.generate({
        prompt: translateStringPrompt.prompt,
        model: selectedModel,
        input: promptInput,
        output: {
            schema: translateStringPrompt.output.schema
        }
    });
    return output!;
  }
);
