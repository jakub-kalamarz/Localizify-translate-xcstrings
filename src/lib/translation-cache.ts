interface CacheEntry {
  translatedText: string;
  timestamp: number;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
}

interface TranslationCache {
  [key: string]: CacheEntry;
}

class TranslationCacheManager {
  private cache: TranslationCache = {};
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private readonly CACHE_KEY = 'translation_cache';
  private readonly MAX_CACHE_SIZE = 10000; // Maximum number of cached translations

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private generateCacheKey(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string
  ): string {
    // Create a hash-like key from the input parameters
    const input = `${text}|${sourceLanguage}|${targetLanguage}|${model}`;
    return btoa(input).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsedCache = JSON.parse(stored);
        this.cache = parsedCache;
        this.cleanExpiredEntries();
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
      this.cache = {};
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp > this.CACHE_EXPIRY) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      delete this.cache[key];
    });

    if (keysToRemove.length > 0) {
      this.saveToStorage();
    }
  }

  private limitCacheSize(): void {
    const entries = Object.entries(this.cache);
    
    if (entries.length > this.MAX_CACHE_SIZE) {
      // Sort by timestamp and remove oldest entries
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      
      toRemove.forEach(([key]) => {
        delete this.cache[key];
      });
      
      this.saveToStorage();
    }
  }

  get(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string
  ): string | null {
    const key = this.generateCacheKey(text, sourceLanguage, targetLanguage, model);
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }

    return entry.translatedText;
  }

  set(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
    translatedText: string
  ): void {
    const key = this.generateCacheKey(text, sourceLanguage, targetLanguage, model);
    
    this.cache[key] = {
      translatedText,
      timestamp: Date.now(),
      sourceLanguage,
      targetLanguage,
      model,
    };

    this.limitCacheSize();
    this.saveToStorage();
  }

  clear(): void {
    this.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  getStats(): { totalEntries: number; cacheSize: string; oldestEntry: Date | null } {
    const entries = Object.values(this.cache);
    const totalEntries = entries.length;
    
    // Calculate approximate cache size
    const cacheSize = new Blob([JSON.stringify(this.cache)]).size;
    const cacheSizeFormatted = this.formatBytes(cacheSize);
    
    // Find oldest entry
    const oldestTimestamp = entries.reduce((oldest, entry) => 
      Math.min(oldest, entry.timestamp), 
      Date.now()
    );
    
    const oldestEntry = entries.length > 0 ? new Date(oldestTimestamp) : null;
    
    return {
      totalEntries,
      cacheSize: cacheSizeFormatted,
      oldestEntry,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Find similar translations (fuzzy matching)
  findSimilar(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
    threshold: number = 0.8
  ): Array<{ text: string; translation: string; similarity: number }> {
    const results: Array<{ text: string; translation: string; similarity: number }> = [];
    
    for (const [key, entry] of Object.entries(this.cache)) {
      if (entry.sourceLanguage === sourceLanguage && 
          entry.targetLanguage === targetLanguage && 
          entry.model === model) {
        
        // Simple similarity calculation based on common characters
        const similarity = this.calculateSimilarity(text, key);
        
        if (similarity >= threshold) {
          results.push({
            text: key,
            translation: entry.translatedText,
            similarity,
          });
        }
      }
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Export singleton instance
export const translationCache = new TranslationCacheManager();

// Export types
export type { CacheEntry, TranslationCache };