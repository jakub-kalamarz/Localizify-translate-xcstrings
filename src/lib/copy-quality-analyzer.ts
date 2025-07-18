import { 
  QualityAnalysis, 
  QualityIssue, 
  ConsistencyAnalysis, 
  ReadabilityMetrics, 
  QualitySettings,
  ParsedString 
} from '@/types';

interface QualityAnalysisOptions {
  settings: QualitySettings;
  allStrings?: ParsedString[];
  targetLanguage?: string;
}

export class CopyQualityAnalyzer {
  private readonly DEFAULT_SETTINGS: QualitySettings = {
    enabled: true,
    autoAnalyze: true,
    strictMode: false,
    minScore: 70,
    enabledChecks: {
      clarity: true,
      consistency: true,
      formatting: true,
      context: true,
      length: true,
      placeholders: true,
    },
    terminology: {},
  };

  private commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
    'by', 'from', 'up', 'she', 'my', 'more', 'can', 'out', 'other', 'many',
    'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like',
    'him', 'into', 'time', 'has', 'two', 'more', 'go', 'no', 'way', 'could',
    'get', 'use', 'man', 'new', 'now', 'old', 'see', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'first', 'well', 'work', 'know', 'say',
    'here', 'give', 'take', 'each', 'most', 'we', 'me', 'than', 'call', 'water',
    'very', 'what', 'long', 'day', 'look', 'right', 'people', 'may', 'down',
    'side', 'been', 'find', 'any', 'life', 'hand', 'high', 'year', 'come',
    'want', 'light', 'country', 'something', 'without', 'turn', 'every', 'around',
    'form', 'because', 'between', 'house', 'small', 'never', 'become', 'while',
    'sound', 'where', 'much', 'through', 'place', 'turn', 'still', 'such',
    'only', 'name', 'good', 'sentence', 'think', 'great', 'little', 'means',
    'before', 'move', 'right', 'boy', 'old', 'same', 'tell', 'follow', 'came',
    'men', 'ship', 'area', 'half', 'rock', 'order', 'fire', 'south', 'problem',
    'piece', 'told', 'during', 'hundred', 'five', 'remember', 'step', 'early',
    'hold', 'west', 'ground', 'interest', 'reach', 'fast', 'verb', 'sing',
    'listen', 'six', 'table', 'travel', 'less', 'morning', 'ten', 'simple',
    'several', 'vowel', 'toward', 'war', 'lay', 'against', 'pattern', 'slow',
    'center', 'love', 'person', 'money', 'serve', 'appear', 'road', 'map',
    'rain', 'rule', 'govern', 'pull', 'cold', 'notice', 'voice', 'energy',
    'hunt', 'probable', 'bed', 'brother', 'egg', 'ride', 'cell', 'believe',
    'perhaps', 'pick', 'sudden', 'count', 'square', 'reason', 'length', 'represent',
    'art', 'subject', 'region', 'size', 'vary', 'settle', 'speak', 'weight',
    'general', 'ice', 'matter', 'circle', 'pair', 'include', 'divide', 'syllable',
    'felt', 'grand', 'ball', 'yet', 'wave', 'drop', 'heart', 'am', 'present',
    'heavy', 'dance', 'engine', 'position', 'arm', 'wide', 'sail', 'material',
    'size', 'ran', 'sharp', 'wing', 'noise', 'bit', 'movement', 'make', 'story',
    'point', 'since', 'dry', 'though', 'language', 'shape', 'deep', 'thousands',
    'yes', 'clear', 'equation', 'yet', 'government', 'filled', 'heat', 'full',
    'hot', 'check', 'object', 'am', 'rule', 'among', 'noun', 'power', 'cannot',
    'able', 'six', 'size', 'dark', 'ball', 'material', 'special', 'heavy',
    'fine', 'pair', 'circle', 'include', 'built'
  ]);

  /**
   * Analyzes the quality of a text string
   */
  async analyzeText(
    text: string,
    options: QualityAnalysisOptions
  ): Promise<QualityAnalysis> {
    const { settings } = options;
    
    if (!settings.enabled) {
      return this.createEmptyAnalysis();
    }

    const issues: QualityIssue[] = [];
    const suggestions: string[] = [];

    // Run enabled quality checks
    if (settings.enabledChecks.clarity) {
      const clarityIssues = await this.analyzeClarityIssues(text, settings);
      issues.push(...clarityIssues);
    }

    if (settings.enabledChecks.formatting) {
      const formattingIssues = this.analyzeFormattingIssues(text, settings);
      issues.push(...formattingIssues);
    }

    if (settings.enabledChecks.length) {
      const lengthIssues = this.analyzeLengthIssues(text, settings);
      issues.push(...lengthIssues);
    }

    if (settings.enabledChecks.placeholders) {
      const placeholderIssues = this.analyzePlaceholderIssues(text, settings);
      issues.push(...placeholderIssues);
    }

    // Analyze consistency if all strings are provided
    let consistency: ConsistencyAnalysis = this.createEmptyConsistency();
    if (settings.enabledChecks.consistency && options.allStrings) {
      consistency = this.analyzeConsistency(text, options.allStrings, settings);
    }

    // Calculate readability metrics
    const readability = this.calculateReadability(text);

    // Generate suggestions based on issues
    const qualitySuggestions = this.generateSuggestions(issues, text, settings);
    suggestions.push(...qualitySuggestions);

    // Calculate overall quality score
    const score = this.calculateQualityScore(issues, readability, consistency, settings);

    return {
      score,
      issues,
      suggestions,
      consistency,
      readability,
      lastAnalyzed: Date.now(),
    };
  }

  /**
   * Analyzes a translation against its source text
   */
  async analyzeTranslation(
    sourceText: string,
    translationText: string,
    targetLanguage: string,
    options: QualityAnalysisOptions
  ): Promise<QualityAnalysis> {
    const baseAnalysis = await this.analyzeText(translationText, options);
    const { settings } = options;

    // Additional translation-specific checks
    const translationIssues: QualityIssue[] = [];

    // Check length ratio
    if (settings.enabledChecks.length) {
      const lengthRatio = translationText.length / sourceText.length;
      if (lengthRatio > 2.5) {
        translationIssues.push({
          type: 'length',
          severity: 'medium',
          message: `Translation is ${Math.round(lengthRatio * 100)}% longer than source text`,
          suggestion: 'Consider using more concise language while maintaining meaning',
        });
      } else if (lengthRatio < 0.4) {
        translationIssues.push({
          type: 'length',
          severity: 'medium',
          message: `Translation is ${Math.round((1 - lengthRatio) * 100)}% shorter than source text`,
          suggestion: 'Ensure all meaning from source text is preserved',
        });
      }
    }

    // Check placeholder preservation
    if (settings.enabledChecks.placeholders) {
      const sourcePlaceholders = this.extractPlaceholders(sourceText);
      const translationPlaceholders = this.extractPlaceholders(translationText);
      
      if (sourcePlaceholders.length !== translationPlaceholders.length) {
        translationIssues.push({
          type: 'placeholders',
          severity: 'high',
          message: `Placeholder count mismatch: source has ${sourcePlaceholders.length}, translation has ${translationPlaceholders.length}`,
          suggestion: 'Ensure all placeholders (%@, %d, etc.) are preserved in translation',
        });
      }
    }

    // Combine with base analysis
    return {
      ...baseAnalysis,
      issues: [...baseAnalysis.issues, ...translationIssues],
      score: this.calculateQualityScore(
        [...baseAnalysis.issues, ...translationIssues],
        baseAnalysis.readability,
        baseAnalysis.consistency,
        settings
      ),
    };
  }

  /**
   * Analyzes clarity issues in text
   */
  private async analyzeClarityIssues(text: string, settings: QualitySettings): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    const sentences = this.splitIntoSentences(text);

    // Check for overly long sentences
    sentences.forEach((sentence, index) => {
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 25) {
        issues.push({
          type: 'clarity',
          severity: 'medium',
          message: `Sentence ${index + 1} has ${wordCount} words (recommended: under 25)`,
          suggestion: 'Consider breaking into shorter sentences for better readability',
        });
      }
    });

    // Check for passive voice (simplified detection)
    const passivePatterns = [
      /\b(was|were|been|being)\s+\w+ed\b/gi,
      /\b(is|are|am)\s+\w+ed\b/gi,
    ];

    passivePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        issues.push({
          type: 'clarity',
          severity: 'low',
          message: `Detected ${matches.length} instances of passive voice`,
          suggestion: 'Consider using active voice for clearer communication',
        });
      }
    });

    // Check for redundant words
    const redundantPhrases = [
      'in order to',
      'due to the fact that',
      'at this point in time',
      'for the purpose of',
      'with regard to',
      'in the event that',
    ];

    redundantPhrases.forEach(phrase => {
      if (text.toLowerCase().includes(phrase)) {
        issues.push({
          type: 'clarity',
          severity: 'low',
          message: `Contains redundant phrase: "${phrase}"`,
          suggestion: `Consider simplifying: "${phrase}" → "${this.getSimplifiedPhrase(phrase)}"`,
        });
      }
    });

    // Check for complex words when simple alternatives exist
    const complexWords = [
      { complex: 'utilize', simple: 'use' },
      { complex: 'demonstrate', simple: 'show' },
      { complex: 'facilitate', simple: 'help' },
      { complex: 'commence', simple: 'start' },
      { complex: 'terminate', simple: 'end' },
      { complex: 'approximately', simple: 'about' },
      { complex: 'subsequent', simple: 'next' },
      { complex: 'previous', simple: 'last' },
      { complex: 'numerous', simple: 'many' },
      { complex: 'additional', simple: 'more' },
    ];

    complexWords.forEach(({ complex, simple }) => {
      if (text.toLowerCase().includes(complex)) {
        issues.push({
          type: 'clarity',
          severity: 'low',
          message: `Consider simpler alternative to "${complex}"`,
          suggestion: `Use "${simple}" instead of "${complex}"`,
        });
      }
    });

    return issues;
  }

  /**
   * Analyzes formatting issues in text
   */
  private analyzeFormattingIssues(text: string, settings: QualitySettings): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for double spaces
    if (text.includes('  ')) {
      issues.push({
        type: 'formatting',
        severity: 'low',
        message: 'Contains double spaces',
        suggestion: 'Use single spaces between words',
      });
    }

    // Check for leading/trailing whitespace
    if (text !== text.trim()) {
      issues.push({
        type: 'formatting',
        severity: 'low',
        message: 'Contains leading or trailing whitespace',
        suggestion: 'Remove unnecessary whitespace at the beginning or end',
      });
    }

    // Check for inconsistent punctuation
    const hasTrailingPunctuation = /[.!?]$/.test(text);
    const hasMultipleSentences = text.split(/[.!?]/).length > 2;
    
    if (hasMultipleSentences && !hasTrailingPunctuation) {
      issues.push({
        type: 'formatting',
        severity: 'medium',
        message: 'Multi-sentence text missing final punctuation',
        suggestion: 'Add appropriate punctuation at the end',
      });
    }

    // Check for inconsistent capitalization
    const sentences = this.splitIntoSentences(text);
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (trimmed.length > 0 && !/^[A-Z]/.test(trimmed)) {
        issues.push({
          type: 'formatting',
          severity: 'medium',
          message: `Sentence ${index + 1} doesn't start with capital letter`,
          suggestion: 'Ensure sentences start with capital letters',
        });
      }
    });

    return issues;
  }

  /**
   * Analyzes length-related issues in text
   */
  private analyzeLengthIssues(text: string, settings: QualitySettings): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for extremely short text
    if (text.trim().length < 2) {
      issues.push({
        type: 'length',
        severity: 'high',
        message: 'Text is too short to be meaningful',
        suggestion: 'Provide more descriptive text',
      });
    }

    // Check for extremely long text
    if (text.length > 500) {
      issues.push({
        type: 'length',
        severity: 'medium',
        message: `Text is ${text.length} characters (consider breaking up if over 500)`,
        suggestion: 'Consider breaking long text into smaller chunks',
      });
    }

    // Check for single word labels that might need more context
    const words = text.trim().split(/\s+/);
    if (words.length === 1 && words[0].length > 15) {
      issues.push({
        type: 'length',
        severity: 'low',
        message: 'Single word is very long - consider abbreviation or splitting',
        suggestion: 'For UI labels, consider shorter alternatives',
      });
    }

    return issues;
  }

  /**
   * Analyzes placeholder-related issues in text
   */
  private analyzePlaceholderIssues(text: string, settings: QualitySettings): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const placeholders = this.extractPlaceholders(text);

    // Check for malformed placeholders
    const malformedPlaceholders = text.match(/%[^@ds%\s]{1,3}(?!\w)/g);
    if (malformedPlaceholders) {
      issues.push({
        type: 'placeholders',
        severity: 'high',
        message: `Potentially malformed placeholders: ${malformedPlaceholders.join(', ')}`,
        suggestion: 'Ensure placeholders follow correct format (%@, %d, %s, etc.)',
      });
    }

    // Check for placeholder context
    placeholders.forEach((placeholder, index) => {
      const placeholderIndex = text.indexOf(placeholder);
      const before = text.substring(Math.max(0, placeholderIndex - 10), placeholderIndex);
      const after = text.substring(placeholderIndex + placeholder.length, placeholderIndex + placeholder.length + 10);
      
      // Check if placeholder has adequate surrounding context
      if (before.trim().length === 0 && after.trim().length === 0) {
        issues.push({
          type: 'placeholders',
          severity: 'medium',
          message: `Placeholder ${placeholder} lacks context`,
          suggestion: 'Provide descriptive text around placeholders for better understanding',
        });
      }
    });

    return issues;
  }

  /**
   * Analyzes consistency across multiple strings
   */
  private analyzeConsistency(
    text: string,
    allStrings: ParsedString[],
    settings: QualitySettings
  ): ConsistencyAnalysis {
    const analysis: ConsistencyAnalysis = {
      terminologyScore: 100,
      styleScore: 100,
      formattingScore: 100,
      inconsistentTerms: [],
      suggestedTerms: {},
    };

    // Analyze terminology consistency
    const words = text.toLowerCase().split(/\s+/);
    const terminologyIssues = new Set<string>();

    // Check against configured terminology
    Object.entries(settings.terminology).forEach(([incorrect, correct]) => {
      if (words.includes(incorrect.toLowerCase())) {
        terminologyIssues.add(incorrect);
        analysis.suggestedTerms[incorrect] = correct;
      }
    });

    // Check for common inconsistencies across all strings
    const allTexts = allStrings.map(s => s.sourceValue.toLowerCase());
    const variations = this.findTermVariations(allTexts);
    
    variations.forEach(variation => {
      if (words.some(word => variation.includes(word))) {
        terminologyIssues.add(variation[0]);
        analysis.suggestedTerms[variation[0]] = variation[1]; // Suggest most common variant
      }
    });

    analysis.inconsistentTerms = Array.from(terminologyIssues);
    analysis.terminologyScore = Math.max(0, 100 - (terminologyIssues.size * 10));

    // Analyze style consistency
    const hasTrailingPunctuation = /[.!?]$/.test(text);
    const startsWithCapital = /^[A-Z]/.test(text);
    
    // Compare with other strings to find style patterns
    const allHaveTrailingPunctuation = allStrings.every(s => /[.!?]$/.test(s.sourceValue));
    const allStartWithCapital = allStrings.every(s => /^[A-Z]/.test(s.sourceValue));
    
    let styleIssues = 0;
    if (allHaveTrailingPunctuation !== hasTrailingPunctuation) styleIssues++;
    if (allStartWithCapital !== startsWithCapital) styleIssues++;
    
    analysis.styleScore = Math.max(0, 100 - (styleIssues * 25));

    // Analyze formatting consistency
    const hasExtraSpaces = /\s{2,}/.test(text);
    const hasLeadingTrailingSpaces = text !== text.trim();
    
    let formattingIssues = 0;
    if (hasExtraSpaces) formattingIssues++;
    if (hasLeadingTrailingSpaces) formattingIssues++;
    
    analysis.formattingScore = Math.max(0, 100 - (formattingIssues * 25));

    return analysis;
  }

  /**
   * Calculates readability metrics
   */
  private calculateReadability(text: string): ReadabilityMetrics {
    const sentences = this.splitIntoSentences(text);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const syllableCount = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    const averageWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const averageSyllablesPerWord = words.length > 0 ? syllableCount / words.length : 0;
    
    // Count complex words (3+ syllables, not common words)
    const complexWords = words.filter(word => 
      this.countSyllables(word) >= 3 && 
      !this.commonWords.has(word.toLowerCase().replace(/[^a-z]/g, ''))
    ).length;

    // Calculate Flesch Reading Ease score
    const fleschScore = words.length > 0 && sentences.length > 0
      ? 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord)
      : 100;

    // Determine reading grade level
    let grade: ReadabilityMetrics['grade'] = 'elementary';
    if (fleschScore < 30) grade = 'graduate';
    else if (fleschScore < 50) grade = 'college';
    else if (fleschScore < 60) grade = 'high';
    else if (fleschScore < 70) grade = 'middle';

    return {
      score: Math.max(0, Math.min(100, fleschScore)),
      averageWordsPerSentence,
      averageSyllablesPerWord,
      complexWords,
      grade,
    };
  }

  /**
   * Calculates overall quality score
   */
  private calculateQualityScore(
    issues: QualityIssue[],
    readability: ReadabilityMetrics,
    consistency: ConsistencyAnalysis,
    settings: QualitySettings
  ): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });

    // Factor in readability (25% of score)
    score = score * 0.75 + readability.score * 0.25;

    // Factor in consistency (15% of score)
    const consistencyScore = (consistency.terminologyScore + consistency.styleScore + consistency.formattingScore) / 3;
    score = score * 0.85 + consistencyScore * 0.15;

    // Apply strict mode penalty
    if (settings.strictMode) {
      score = score * 0.9;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generates suggestions based on analysis
   */
  private generateSuggestions(
    issues: QualityIssue[],
    text: string,
    settings: QualitySettings
  ): string[] {
    const suggestions: string[] = [];

    // Group issues by type
    const issuesByType = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, QualityIssue[]>);

    // Generate type-specific suggestions
    if (issuesByType.clarity) {
      suggestions.push('Focus on clear, simple language that users can easily understand');
    }

    if (issuesByType.formatting) {
      suggestions.push('Ensure consistent formatting, punctuation, and capitalization');
    }

    if (issuesByType.consistency) {
      suggestions.push('Use consistent terminology and style throughout your app');
    }

    if (issuesByType.length) {
      suggestions.push('Consider the context and length appropriateness for UI elements');
    }

    if (issuesByType.placeholders) {
      suggestions.push('Verify all placeholders are properly formatted and preserved');
    }

    // Add generic suggestions based on score
    const totalIssues = issues.length;
    if (totalIssues === 0) {
      suggestions.push('Great job! Your copy meets quality standards');
    } else if (totalIssues > 5) {
      suggestions.push('Consider reviewing and simplifying your copy for better user experience');
    }

    return suggestions;
  }

  /**
   * Helper methods
   */
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private countSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) return 0;
    
    const vowels = 'aeiouy';
    let syllables = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < cleanWord.length; i++) {
      const isVowel = vowels.includes(cleanWord[i]);
      if (isVowel && !previousWasVowel) {
        syllables++;
      }
      previousWasVowel = isVowel;
    }
    
    // Silent e
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--;
    }
    
    return Math.max(1, syllables);
  }

  private extractPlaceholders(text: string): string[] {
    const placeholderPattern = /%[@dsSfFgGeEcCoxXuUhHpPn%]/g;
    return text.match(placeholderPattern) || [];
  }

  private findTermVariations(texts: string[]): string[][] {
    // This is a simplified implementation
    // In a real scenario, you'd use more sophisticated NLP techniques
    const variations: string[][] = [];
    
    // Common variations to look for
    const commonVariations = [
      ['login', 'log in', 'log-in'],
      ['setup', 'set up', 'set-up'],
      ['signup', 'sign up', 'sign-up'],
      ['email', 'e-mail'],
      ['website', 'web site'],
      ['username', 'user name'],
      ['password', 'pass word'],
      ['okay', 'ok', 'OK'],
      ['cancel', 'cancelled', 'canceled'],
    ];

    commonVariations.forEach(variation => {
      const foundVariants = variation.filter(variant => 
        texts.some(text => text.includes(variant))
      );
      if (foundVariants.length > 1) {
        variations.push(foundVariants);
      }
    });

    return variations;
  }

  private getSimplifiedPhrase(phrase: string): string {
    const simplifications: Record<string, string> = {
      'in order to': 'to',
      'due to the fact that': 'because',
      'at this point in time': 'now',
      'for the purpose of': 'to',
      'with regard to': 'about',
      'in the event that': 'if',
    };
    
    return simplifications[phrase] || phrase;
  }

  private createEmptyAnalysis(): QualityAnalysis {
    return {
      score: 100,
      issues: [],
      suggestions: [],
      consistency: this.createEmptyConsistency(),
      readability: {
        score: 100,
        averageWordsPerSentence: 0,
        averageSyllablesPerWord: 0,
        complexWords: 0,
        grade: 'elementary',
      },
      lastAnalyzed: Date.now(),
    };
  }

  private createEmptyConsistency(): ConsistencyAnalysis {
    return {
      terminologyScore: 100,
      styleScore: 100,
      formattingScore: 100,
      inconsistentTerms: [],
      suggestedTerms: {},
    };
  }
}

// Export singleton instance
export const copyQualityAnalyzer = new CopyQualityAnalyzer();