import { z } from 'zod';

// File validation schemas
export const FileValidationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().regex(/^application\/json$|^text\/plain$/, 'File must be JSON or plain text'),
});

// XCStrings file structure validation
export const XCStringsSchema = z.object({
  sourceLanguage: z.string().min(1, 'Source language is required'),
  strings: z.record(z.object({
    comment: z.string().optional(),
    extractionState: z.string().optional(),
    localizations: z.record(z.object({
      stringUnit: z.object({
        state: z.enum(['translated', 'new', 'needs_review']),
        value: z.string(),
      }),
      substitutions: z.unknown().optional(),
    })).optional(),
  })),
  version: z.string().optional(),
});

// Language code validation
export const LanguageCodeSchema = z.string().regex(
  /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/,
  'Language code must be in format: "en", "fr", "zh-Hans", etc.'
);

// API key validation
export const OpenAIApiKeySchema = z.string().regex(
  /^sk-[a-zA-Z0-9_-]{48,}$/,
  'OpenAI API key must start with "sk-" and be at least 48 characters long'
);

// Translation request validation
export const TranslationRequestSchema = z.object({
  key: z.string().min(1, 'Translation key is required'),
  text: z.string().min(1, 'Text to translate is required'),
});

// Validation utility functions
export function validateFile(file: File): { isValid: boolean; error?: string } {
  try {
    // Check file extension
    if (!file.name.endsWith('.xcstrings')) {
      return { isValid: false, error: 'File must have .xcstrings extension' };
    }

    // Validate file properties
    FileValidationSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type || 'application/json',
    });

    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid file' };
  }
}

export function validateXCStringsContent(content: string): { isValid: boolean; error?: string; data?: any } {
  try {
    const parsed = JSON.parse(content);
    const validated = XCStringsSchema.parse(parsed);
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
    if (error instanceof z.ZodError) {
      return { isValid: false, error: `Invalid .xcstrings structure: ${error.errors[0].message}` };
    }
    return { isValid: false, error: 'Invalid file content' };
  }
}

export function validateLanguageCode(code: string): { isValid: boolean; error?: string } {
  try {
    LanguageCodeSchema.parse(code);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid language code' };
  }
}

export function validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
  if (!apiKey.trim()) {
    return { isValid: false, error: 'API key is required' };
  }

  try {
    OpenAIApiKeySchema.parse(apiKey);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid API key format' };
  }
}

import { TranslationRequest } from '@/lib/openai-translator';

export function validateTranslationRequest(request: TranslationRequest): { isValid: boolean; error?: string } {
  try {
    TranslationRequestSchema.parse(request);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid translation request' };
  }
}

// Sanitization functions
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
}

export function sanitizeLanguageCode(code: string): string {
  return code.trim().replace(/[^a-zA-Z-]/g, '');
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  languageCode: /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/,
  apiKey: /^sk-[a-zA-Z0-9_-]{48,}$/,
} as const;