import { ParsedString, QualityAnalysis, QualityIssue, QualitySettings } from '@/types';
import { CopyQualityAnalyzer } from './copy-quality-analyzer';

export interface QualityEnhancementSuggestion {
  type: 'improve' | 'fix' | 'optimize';
  category: 'clarity' | 'consistency' | 'formatting' | 'context' | 'length' | 'placeholders';
  originalText: string;
  suggestedText: string;
  reason: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
}

export interface QualityEnhancementResult {
  originalString: ParsedString;
  qualityAnalysis: QualityAnalysis;
  suggestions: QualityEnhancementSuggestion[];
  improvedString?: ParsedString;
  qualityImprovement: number; // score difference
}

export class XCStringsQualityEnhancer {
  private analyzer: CopyQualityAnalyzer;
  private settings: QualitySettings;

  constructor(settings?: Partial<QualitySettings>) {
    this.analyzer = new CopyQualityAnalyzer();
    this.settings = {
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
      ...settings
    };
  }

  /**
   * Analyzes and enhances the quality of all strings in an xcstrings file
   */
  async enhanceXCStringsQuality(
    strings: ParsedString[],
    sourceLanguage: string,
    options: {
      autoApplyImprovements?: boolean;
      confidenceThreshold?: number;
      focusAreas?: string[];
    } = {}
  ): Promise<{
    results: QualityEnhancementResult[];
    overallQualityScore: number;
    totalImprovements: number;
    enhancedStrings: ParsedString[];
  }> {
    const results: QualityEnhancementResult[] = [];
    const confidenceThreshold = options.confidenceThreshold ?? 80;
    
    // Process each string
    for (const string of strings) {
      const result = await this.analyzeAndEnhanceString(
        string,
        strings,
        sourceLanguage,
        options.focusAreas
      );
      results.push(result);
    }

    // Calculate overall metrics
    const overallQualityScore = this.calculateOverallQuality(results);
    const totalImprovements = results.reduce((sum, r) => sum + r.suggestions.length, 0);

    // Apply improvements if requested
    const enhancedStrings = options.autoApplyImprovements 
      ? this.applyImprovements(results, confidenceThreshold)
      : strings;

    return {
      results,
      overallQualityScore,
      totalImprovements,
      enhancedStrings
    };
  }

  /**
   * Analyzes and generates improvement suggestions for a single string
   */
  private async analyzeAndEnhanceString(
    string: ParsedString,
    allStrings: ParsedString[],
    sourceLanguage: string,
    focusAreas?: string[]
  ): Promise<QualityEnhancementResult> {
    // Analyze current quality
    const qualityAnalysis = await this.analyzer.analyzeText(string.sourceValue, {
      settings: this.settings,
      allStrings,
      targetLanguage: sourceLanguage
    });

    // Generate improvement suggestions
    const suggestions = await this.generateImprovementSuggestions(
      string,
      qualityAnalysis,
      allStrings,
      focusAreas
    );

    // Create improved version if suggestions exist
    const improvedString = suggestions.length > 0 
      ? this.createImprovedString(string, suggestions)
      : undefined;

    // Calculate quality improvement
    const qualityImprovement = improvedString 
      ? await this.calculateQualityImprovement(string, improvedString, allStrings, sourceLanguage)
      : 0;

    return {
      originalString: string,
      qualityAnalysis,
      suggestions,
      improvedString,
      qualityImprovement
    };
  }

  /**
   * Generates specific improvement suggestions based on quality analysis
   */
  private async generateImprovementSuggestions(
    string: ParsedString,
    analysis: QualityAnalysis,
    allStrings: ParsedString[],
    focusAreas?: string[]
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];
    const text = string.sourceValue;

    // Focus only on specified areas if provided
    const shouldAnalyzeCategory = (category: string) => 
      !focusAreas || focusAreas.includes(category);

    // Clarity improvements
    if (shouldAnalyzeCategory('clarity')) {
      suggestions.push(...await this.generateClarityImprovements(text, analysis));
    }

    // Consistency improvements
    if (shouldAnalyzeCategory('consistency')) {
      suggestions.push(...await this.generateConsistencyImprovements(text, analysis, allStrings));
    }

    // Formatting improvements
    if (shouldAnalyzeCategory('formatting')) {
      suggestions.push(...await this.generateFormattingImprovements(text, analysis));
    }

    // Context improvements
    if (shouldAnalyzeCategory('context')) {
      suggestions.push(...await this.generateContextImprovements(text, string, analysis));
    }

    // Length improvements
    if (shouldAnalyzeCategory('length')) {
      suggestions.push(...await this.generateLengthImprovements(text, analysis));
    }

    // Placeholder improvements
    if (shouldAnalyzeCategory('placeholders')) {
      suggestions.push(...await this.generatePlaceholderImprovements(text, analysis));
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateClarityImprovements(
    text: string,
    analysis: QualityAnalysis
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check for complex sentences
    if (analysis.readability.averageWordsPerSentence > 20) {
      suggestions.push({
        type: 'improve',
        category: 'clarity',
        originalText: text,
        suggestedText: this.simplifyComplexSentences(text),
        reason: 'Break down complex sentences for better readability',
        confidence: 85,
        impact: 'high'
      });
    }

    // Check for passive voice
    if (this.containsPassiveVoice(text)) {
      suggestions.push({
        type: 'improve',
        category: 'clarity',
        originalText: text,
        suggestedText: this.convertToActiveVoice(text),
        reason: 'Convert passive voice to active voice for clarity',
        confidence: 75,
        impact: 'medium'
      });
    }

    // Check for unclear pronouns
    if (this.hasUnclearPronouns(text)) {
      suggestions.push({
        type: 'improve',
        category: 'clarity',
        originalText: text,
        suggestedText: this.clarifyPronouns(text),
        reason: 'Replace unclear pronouns with specific nouns',
        confidence: 70,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private async generateConsistencyImprovements(
    text: string,
    analysis: QualityAnalysis,
    allStrings: ParsedString[]
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check for inconsistent terminology
    const terminologyIssues = this.findTerminologyInconsistencies(text, allStrings);
    for (const issue of terminologyIssues) {
      suggestions.push({
        type: 'fix',
        category: 'consistency',
        originalText: text,
        suggestedText: text.replace(issue.inconsistentTerm, issue.standardTerm),
        reason: `Use consistent terminology: "${issue.standardTerm}" instead of "${issue.inconsistentTerm}"`,
        confidence: 90,
        impact: 'high'
      });
    }

    // Check for inconsistent capitalization
    const capitalizationIssues = this.findCapitalizationInconsistencies(text, allStrings);
    for (const issue of capitalizationIssues) {
      suggestions.push({
        type: 'fix',
        category: 'consistency',
        originalText: text,
        suggestedText: issue.correctedText,
        reason: `Maintain consistent capitalization: "${issue.suggestion}"`,
        confidence: 85,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private async generateFormattingImprovements(
    text: string,
    analysis: QualityAnalysis
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check for spacing issues
    if (this.hasSpacingIssues(text)) {
      suggestions.push({
        type: 'fix',
        category: 'formatting',
        originalText: text,
        suggestedText: this.fixSpacingIssues(text),
        reason: 'Fix spacing issues (multiple spaces, trailing spaces)',
        confidence: 95,
        impact: 'low'
      });
    }

    // Check for punctuation issues
    if (this.hasPunctuationIssues(text)) {
      suggestions.push({
        type: 'fix',
        category: 'formatting',
        originalText: text,
        suggestedText: this.fixPunctuationIssues(text),
        reason: 'Fix punctuation issues (missing periods, incorrect quotation marks)',
        confidence: 90,
        impact: 'medium'
      });
    }

    // Check for sentence case issues
    if (this.hasSentenceCaseIssues(text)) {
      suggestions.push({
        type: 'fix',
        category: 'formatting',
        originalText: text,
        suggestedText: this.fixSentenceCase(text),
        reason: 'Fix sentence case (capitalize first letter of sentences)',
        confidence: 85,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private async generateContextImprovements(
    text: string,
    string: ParsedString,
    analysis: QualityAnalysis
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check if context is needed for ambiguous terms
    const ambiguousTerms = this.findAmbiguousTerms(text);
    if (ambiguousTerms.length > 0) {
      suggestions.push({
        type: 'improve',
        category: 'context',
        originalText: text,
        suggestedText: this.addContextualClarity(text, ambiguousTerms),
        reason: `Add context for ambiguous terms: ${ambiguousTerms.join(', ')}`,
        confidence: 70,
        impact: 'high'
      });
    }

    // Check for missing context in UI strings
    if (this.isUIString(string.key) && this.lacksUIContext(text)) {
      suggestions.push({
        type: 'improve',
        category: 'context',
        originalText: text,
        suggestedText: this.addUIContext(text, string.key),
        reason: 'Add UI context for better user understanding',
        confidence: 75,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private async generateLengthImprovements(
    text: string,
    analysis: QualityAnalysis
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check for overly long text
    if (text.length > 100) {
      suggestions.push({
        type: 'optimize',
        category: 'length',
        originalText: text,
        suggestedText: this.shortenText(text),
        reason: 'Shorten text for better mobile experience and readability',
        confidence: 70,
        impact: 'medium'
      });
    }

    // Check for unnecessarily verbose language
    if (this.isVerbose(text)) {
      suggestions.push({
        type: 'optimize',
        category: 'length',
        originalText: text,
        suggestedText: this.makeMoreConcise(text),
        reason: 'Make text more concise while maintaining meaning',
        confidence: 65,
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private async generatePlaceholderImprovements(
    text: string,
    analysis: QualityAnalysis
  ): Promise<QualityEnhancementSuggestion[]> {
    const suggestions: QualityEnhancementSuggestion[] = [];

    // Check for placeholder formatting issues
    const placeholderIssues = this.findPlaceholderIssues(text);
    for (const issue of placeholderIssues) {
      suggestions.push({
        type: 'fix',
        category: 'placeholders',
        originalText: text,
        suggestedText: issue.correctedText,
        reason: `Fix placeholder formatting: ${issue.description}`,
        confidence: 95,
        impact: 'high'
      });
    }

    // Check for descriptive placeholder names
    if (this.hasNonDescriptivePlaceholders(text)) {
      suggestions.push({
        type: 'improve',
        category: 'placeholders',
        originalText: text,
        suggestedText: this.improveDescriptivePlaceholders(text),
        reason: 'Use descriptive placeholder names for better translator understanding',
        confidence: 80,
        impact: 'high'
      });
    }

    return suggestions;
  }

  // Helper methods for quality analysis
  private simplifyComplexSentences(text: string): string {
    // Basic sentence simplification logic
    return text.replace(/([^.!?]+)[,;]([^.!?]+)/g, '$1. $2');
  }

  private containsPassiveVoice(text: string): boolean {
    const passivePatterns = [
      /\b(is|are|was|were|being|been)\s+\w+ed\b/i,
      /\b(is|are|was|were|being|been)\s+\w+en\b/i
    ];
    return passivePatterns.some(pattern => pattern.test(text));
  }

  private convertToActiveVoice(text: string): string {
    // Basic active voice conversion (simplified)
    return text.replace(/\b(is|are|was|were)\s+(\w+ed|written|taken|given|shown)\b/gi, 
      (match, verb, pastParticiple) => {
        // This is a simplified conversion - real implementation would be more complex
        return `${verb} ${pastParticiple}`;
      });
  }

  private hasUnclearPronouns(text: string): boolean {
    const unclearPronouns = /\b(it|this|that|they|them)\b/gi;
    return unclearPronouns.test(text);
  }

  private clarifyPronouns(text: string): string {
    // This would need context to work properly - simplified example
    return text.replace(/\bthis\b/gi, 'this feature');
  }

  private findTerminologyInconsistencies(text: string, allStrings: ParsedString[]): Array<{
    inconsistentTerm: string;
    standardTerm: string;
  }> {
    // Analyze all strings to find most common terms and their variations
    const termVariations = new Map<string, string[]>();
    
    // This would be more sophisticated in real implementation
    const commonInconsistencies = [
      { inconsistentTerm: 'log in', standardTerm: 'login' },
      { inconsistentTerm: 'sign-in', standardTerm: 'sign in' },
      { inconsistentTerm: 'email', standardTerm: 'e-mail' },
    ];

    return commonInconsistencies.filter(inc => 
      text.toLowerCase().includes(inc.inconsistentTerm.toLowerCase())
    );
  }

  private findCapitalizationInconsistencies(text: string, allStrings: ParsedString[]): Array<{
    correctedText: string;
    suggestion: string;
  }> {
    const issues: Array<{ correctedText: string; suggestion: string }> = [];
    
    // Check for inconsistent button text capitalization
    if (this.isButtonText(text)) {
      const corrected = this.toTitleCase(text);
      if (corrected !== text) {
        issues.push({
          correctedText: corrected,
          suggestion: 'Use title case for button text'
        });
      }
    }

    return issues;
  }

  private hasSpacingIssues(text: string): boolean {
    return /\s{2,}|\s$|^\s/.test(text);
  }

  private fixSpacingIssues(text: string): string {
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  private hasPunctuationIssues(text: string): boolean {
    // Check for missing periods in sentences, incorrect quotation marks, etc.
    return /[a-z]\s*$/.test(text.trim()) || /\s[.!?]/.test(text);
  }

  private fixPunctuationIssues(text: string): string {
    let fixed = text;
    
    // Fix spacing before punctuation
    fixed = fixed.replace(/\s+([.!?])/g, '$1');
    
    // Add period if sentence doesn't end with punctuation
    if (/[a-z]\s*$/.test(fixed.trim())) {
      fixed = fixed.trim() + '.';
    }
    
    return fixed;
  }

  private hasSentenceCaseIssues(text: string): boolean {
    return /^[a-z]/.test(text);
  }

  private fixSentenceCase(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private findAmbiguousTerms(text: string): string[] {
    const ambiguousTerms = ['save', 'delete', 'open', 'close', 'run', 'stop'];
    return ambiguousTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  }

  private addContextualClarity(text: string, ambiguousTerms: string[]): string {
    let improved = text;
    
    // Add context for ambiguous terms
    ambiguousTerms.forEach(term => {
      const contextualReplacement = this.getContextualReplacement(term);
      improved = improved.replace(new RegExp(`\\b${term}\\b`, 'gi'), contextualReplacement);
    });
    
    return improved;
  }

  private getContextualReplacement(term: string): string {
    const contextMap: { [key: string]: string } = {
      'save': 'save changes',
      'delete': 'delete item',
      'open': 'open file',
      'close': 'close window',
      'run': 'run process',
      'stop': 'stop process'
    };
    
    return contextMap[term.toLowerCase()] || term;
  }

  private isUIString(key: string): boolean {
    const uiPatterns = ['button', 'label', 'title', 'placeholder', 'tooltip'];
    return uiPatterns.some(pattern => key.toLowerCase().includes(pattern));
  }

  private lacksUIContext(text: string): boolean {
    return text.length < 20 && !text.includes('button') && !text.includes('field');
  }

  private addUIContext(text: string, key: string): string {
    if (key.includes('button')) {
      return `${text} button`;
    }
    if (key.includes('field')) {
      return `${text} field`;
    }
    return text;
  }

  private shortenText(text: string): string {
    // Basic text shortening logic
    return text.replace(/very\s+/gi, '').replace(/really\s+/gi, '');
  }

  private isVerbose(text: string): boolean {
    const verbosePatterns = [
      /\bvery\s+/gi,
      /\breally\s+/gi,
      /\bquite\s+/gi,
      /\bin order to\b/gi,
      /\bdue to the fact that\b/gi
    ];
    return verbosePatterns.some(pattern => pattern.test(text));
  }

  private makeMoreConcise(text: string): string {
    let concise = text;
    
    // Replace verbose phrases with concise alternatives
    const replacements = [
      { verbose: /\bin order to\b/gi, concise: 'to' },
      { verbose: /\bdue to the fact that\b/gi, concise: 'because' },
      { verbose: /\bvery\s+/gi, concise: '' },
      { verbose: /\breally\s+/gi, concise: '' },
      { verbose: /\bquite\s+/gi, concise: '' }
    ];
    
    replacements.forEach(({ verbose, concise: replacement }) => {
      concise = concise.replace(verbose, replacement);
    });
    
    return concise.trim();
  }

  private findPlaceholderIssues(text: string): Array<{
    correctedText: string;
    description: string;
  }> {
    const issues: Array<{ correctedText: string; description: string }> = [];
    
    // Check for inconsistent placeholder formats
    if (text.includes('%s') && text.includes('{')) {
      issues.push({
        correctedText: text.replace(/%s/g, '{}'),
        description: 'Use consistent placeholder format'
      });
    }
    
    return issues;
  }

  private hasNonDescriptivePlaceholders(text: string): boolean {
    return /\{[0-9]+\}/.test(text) || /%[ds]/.test(text);
  }

  private improveDescriptivePlaceholders(text: string): string {
    // Replace numeric placeholders with descriptive ones
    return text.replace(/\{([0-9]+)\}/g, (match, num) => {
      // This would need more context to provide meaningful names
      return `{value${num}}`;
    });
  }

  private isButtonText(text: string): boolean {
    return text.length < 30 && !text.includes('.');
  }

  private toTitleCase(text: string): string {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  private createImprovedString(
    originalString: ParsedString,
    suggestions: QualityEnhancementSuggestion[]
  ): ParsedString {
    let improvedText = originalString.sourceValue;
    
    // Apply high-confidence suggestions automatically
    suggestions
      .filter(s => s.confidence >= 80)
      .forEach(suggestion => {
        improvedText = suggestion.suggestedText;
      });

    return {
      ...originalString,
      sourceValue: improvedText
    };
  }

  private async calculateQualityImprovement(
    originalString: ParsedString,
    improvedString: ParsedString,
    allStrings: ParsedString[],
    sourceLanguage: string
  ): Promise<number> {
    const originalAnalysis = await this.analyzer.analyzeText(originalString.sourceValue, {
      settings: this.settings,
      allStrings,
      targetLanguage: sourceLanguage
    });

    const improvedAnalysis = await this.analyzer.analyzeText(improvedString.sourceValue, {
      settings: this.settings,
      allStrings,
      targetLanguage: sourceLanguage
    });

    return improvedAnalysis.score - originalAnalysis.score;
  }

  private applyImprovements(
    results: QualityEnhancementResult[],
    confidenceThreshold: number
  ): ParsedString[] {
    return results.map(result => {
      const highConfidenceSuggestions = result.suggestions.filter(
        s => s.confidence >= confidenceThreshold
      );

      if (highConfidenceSuggestions.length > 0) {
        return result.improvedString || result.originalString;
      }

      return result.originalString;
    });
  }

  private calculateOverallQuality(results: QualityEnhancementResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.qualityAnalysis.score, 0);
    return totalScore / results.length;
  }
}

export default XCStringsQualityEnhancer;