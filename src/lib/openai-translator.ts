import OpenAI from 'openai';
import { translationCache } from './translation-cache';

export interface TranslationRequest {
  key: string;
  text: string;
}

export interface TranslationResult {
  key: string;
  translatedText: string;
  error?: string;
}

export interface TranslationOptions {
  model?: string;
  maxRetries?: number;
  temperature?: number;
  appContext?: string;
  onProgress?: (completed: number, total: number) => void;
  abortSignal?: AbortSignal;
}

const DEFAULT_OPTIONS: TranslationOptions = {
  model: 'gpt-4o-mini',
  maxRetries: 3,
  temperature: 0.3,
};

export async function translateString(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  options: TranslationOptions = {}
): Promise<string> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const client = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });

  const contextSection = finalOptions.appContext 
    ? `

App Context: ${finalOptions.appContext}

Use this context to make your translation more accurate and appropriate for the specific application.`
    : '';

  const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.${contextSection}

Keep the translation:
- Natural and fluent
- Contextually appropriate for the application
- Preserving any special formatting or placeholders (like %@, %d, etc.)
- Maintaining the original tone and style

Text to translate: ${text}

IMPORTANT: Respond with ONLY the translated text. Do not add quotes, explanations, or any additional formatting around the translation.`;

  const response = await client.chat.completions.create({
    model: finalOptions.model!,
    messages: [{ role: 'user', content: prompt }],
    temperature: finalOptions.temperature,
    max_tokens: 1000,
  }, {
    signal: finalOptions.abortSignal,
  });

  let translatedText = response.choices[0]?.message?.content?.trim();
  if (!translatedText) {
    throw new Error('No translation received from OpenAI');
  }

  // Strip surrounding quotes that might be added by the model
  translatedText = translatedText.replace(/^["']|["']$/g, '');

  return translatedText;
}

export async function translateBatch(
  requests: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  options: TranslationOptions = {}
): Promise<TranslationResult[]> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Check cache first and filter out cached results
  const cachedResults: TranslationResult[] = [];
  const uncachedRequests: TranslationRequest[] = [];
  
  for (const request of requests) {
    // Skip translation if key is empty
    if (request.key === "") {
      continue;
    }
    
    const cachedTranslation = translationCache.get(
      request.text,
      sourceLanguage,
      targetLanguage,
      finalOptions.model!
    );
    
    if (cachedTranslation) {
      cachedResults.push({
        key: request.key,
        translatedText: cachedTranslation
      });
    } else {
      uncachedRequests.push(request);
    }
  }
  
  // If all requests are cached, return cached results
  if (uncachedRequests.length === 0) {
    return cachedResults;
  }
  
  // Translate uncached requests
  const uncachedResults = await translateBatchStructured(
    uncachedRequests, 
    sourceLanguage, 
    targetLanguage, 
    apiKey, 
    finalOptions
  );
  
  // Cache the new results
  for (const result of uncachedResults) {
    if (!result.error && result.translatedText) {
      const originalRequest = uncachedRequests.find(req => req.key === result.key);
      if (originalRequest) {
        translationCache.set(
          originalRequest.text,
          sourceLanguage,
          targetLanguage,
          finalOptions.model!,
          result.translatedText
        );
      }
    }
  }
  
  // Combine cached and uncached results
  return [...cachedResults, ...uncachedResults];
}

async function translateBatchStructured(
  requests: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  options: TranslationOptions
): Promise<TranslationResult[]> {
  const client = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });

  const contextSection = options.appContext 
    ? `

App Context: ${options.appContext}

Use this context to make your translation more accurate and appropriate for the specific application.`
    : '';

  // Create structured output schema
  const translationSchema = {
    type: "object",
    properties: {
      translations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "The original key identifier"
            },
            translatedText: {
              type: "string",
              description: "The translated text"
            }
          },
          required: ["key", "translatedText"],
          additionalProperties: false
        }
      }
    },
    required: ["translations"],
    additionalProperties: false
  };

  // Process in chunks of 20 keys
  const chunkSize = 20;
  const results: TranslationResult[] = [];
  
  // Report initial progress
  if (options.onProgress) {
    options.onProgress(0, requests.length);
  }

  for (let i = 0; i < requests.length; i += chunkSize) {
    // Check if translation was cancelled
    if (options.abortSignal?.aborted) {
      throw new Error('Translation cancelled');
    }
    
    const chunk = requests.slice(i, i + chunkSize);
    
    // Create the input for this chunk
    const textsToTranslate = chunk.map(req => `Key: ${req.key}\nText: ${req.text}`).join('\n\n');

    const prompt = `You are a professional translator. Translate the following texts from ${sourceLanguage} to ${targetLanguage}.${contextSection}

Keep the translation:
- Natural and fluent
- Contextually appropriate for the application
- Preserving any special formatting or placeholders (like %@, %d, etc.)
- Maintaining the original tone and style

Texts to translate:
${textsToTranslate}

IMPORTANT: Return a JSON object with a "translations" array where each object contains the original "key" and the "translatedText". Match each key with its corresponding translation.`;

    try {
      const response = await client.chat.completions.create({
        model: options.model!,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature,
        max_tokens: 4000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_batch",
            schema: translationSchema,
            strict: true
          }
        }
      }, {
        signal: options.abortSignal,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response received from OpenAI');
      }

      const parsed = JSON.parse(content);
      const translations = parsed.translations;

      // Map back to TranslationResult format for this chunk
      const chunkResults: TranslationResult[] = chunk.map(request => {
        const translation = translations.find((t: any) => t.key === request.key);
        if (translation) {
          return {
            key: request.key,
            translatedText: translation.translatedText
          };
        } else {
          return {
            key: request.key,
            translatedText: '',
            error: 'Translation not found in response'
          };
        }
      });

      results.push(...chunkResults);

      // Report progress after each chunk
      if (options.onProgress) {
        options.onProgress(results.length, requests.length);
      }

    } catch (error) {
      // If the error is a 401 Unauthorized, we want to stop the entire process
      // because the API key is invalid and all subsequent requests will fail.
      if (error instanceof OpenAI.APIError && error.status === 401) {
        // Re-throw the error to be caught by the calling function
        throw error;
      }

      console.error(`Structured translation failed for chunk ${i / chunkSize + 1}:`, error);
      
      // Add error results for this chunk
      const errorResults: TranslationResult[] = chunk.map(request => ({
        key: request.key,
        translatedText: '',
        error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      
      results.push(...errorResults);

      // Report progress even for failed chunks
      if (options.onProgress) {
        options.onProgress(results.length, requests.length);
      }
    }
  }

  return results;
}

async function translateBatchFallback(
  requests: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  options: TranslationOptions
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  
  // Process translations in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchPromises = batch.map(async (request) => {
      return await translateWithRetry(request, sourceLanguage, targetLanguage, apiKey, options);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Report progress after each batch completes
    if (options.onProgress) {
      options.onProgress(results.length, requests.length);
    }
  }
  
  return results;
}

export interface TranslationBatchRequest {
  language: string;
  requests: TranslationRequest[];
}

export interface TranslationBatchResult {
  language: string;
  results: TranslationResult[];
  completed: number;
  failed: number;
}

export async function translateMultipleLanguages(
  batches: TranslationBatchRequest[],
  sourceLanguage: string,
  apiKey: string,
  options: TranslationOptions = {},
  onLanguageProgress?: (language: string, completed: number, total: number, status: 'pending' | 'in-progress' | 'completed' | 'failed') => void
): Promise<TranslationBatchResult[]> {
  const results: TranslationBatchResult[] = [];
  
  // Process languages with controlled concurrency (2 at a time)
  const CONCURRENT_LANGUAGES = 2;
  const languageChunks: TranslationBatchRequest[][] = [];
  
  for (let i = 0; i < batches.length; i += CONCURRENT_LANGUAGES) {
    languageChunks.push(batches.slice(i, i + CONCURRENT_LANGUAGES));
  }
  
  for (const chunk of languageChunks) {
    // Check if translation was cancelled
    if (options.abortSignal?.aborted) {
      throw new Error('Translation cancelled');
    }
    
    // Process chunk in parallel
    const chunkPromises = chunk.map(async (batch) => {
      onLanguageProgress?.(batch.language, 0, batch.requests.length, 'in-progress');
      
      try {
        const languageResults = await translateBatch(
          batch.requests,
          sourceLanguage,
          batch.language,
          apiKey,
          {
            ...options,
            onProgress: (completed, total) => {
              onLanguageProgress?.(batch.language, completed, total, 'in-progress');
            }
          }
        );
        
        const completed = languageResults.filter(r => !r.error).length;
        const failed = languageResults.filter(r => r.error).length;
        
        const result: TranslationBatchResult = {
          language: batch.language,
          results: languageResults,
          completed,
          failed
        };
        
        onLanguageProgress?.(batch.language, completed + failed, batch.requests.length, 'completed');
        return result;
      } catch (error) {
        onLanguageProgress?.(batch.language, 0, batch.requests.length, 'failed');
        // Re-throw the error to be caught by the top-level try-catch in the component
        throw error;
      }
    });
    
    // Wait for all languages in this chunk to complete
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
}

async function translateWithRetry(
  request: TranslationRequest,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  options: TranslationOptions
): Promise<TranslationResult> {
  // Skip translation if key is empty
  if (request.key === "") {
    return { 
      key: request.key, 
      translatedText: '', 
      error: 'Key is empty' 
    };
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < options.maxRetries!; attempt++) {
    try {
      if (!request.text?.trim()) {
        return { 
          key: request.key, 
          translatedText: '', 
          error: 'Source text is empty' 
        };
      }

      const translatedText = await translateString(
        request.text,
        sourceLanguage,
        targetLanguage,
        apiKey,
        options
      );

      return { key: request.key, translatedText };
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      if (attempt < options.maxRetries! - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`Translation failed for key "${request.key}" after ${options.maxRetries} attempts:`, lastError);
  return { 
    key: request.key, 
    translatedText: '', 
    error: lastError?.message || 'Translation failed' 
  };
}

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];