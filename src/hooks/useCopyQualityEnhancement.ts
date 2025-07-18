import { useState, useCallback } from 'react';
import { ParsedString, QualitySettings } from '@/types';
import { XCStringsQualityEnhancer, QualityEnhancementResult } from '@/lib/xcstrings-quality-enhancer';

export interface CopyQualityEnhancementState {
  isAnalyzing: boolean;
  results: QualityEnhancementResult[];
  overallQualityScore: number;
  totalImprovements: number;
  enhancedStrings: ParsedString[];
  showDialog: boolean;
}

export function useCopyQualityEnhancement(settings?: Partial<QualitySettings>) {
  const [state, setState] = useState<CopyQualityEnhancementState>({
    isAnalyzing: false,
    results: [],
    overallQualityScore: 0,
    totalImprovements: 0,
    enhancedStrings: [],
    showDialog: false
  });

  const enhancer = new XCStringsQualityEnhancer(settings);

  const analyzeStrings = useCallback(async (
    strings: ParsedString[],
    sourceLanguage: string,
    options: {
      autoApplyImprovements?: boolean;
      confidenceThreshold?: number;
      focusAreas?: string[];
      showDialog?: boolean;
    } = {}
  ) => {
    // Use a microtask to ensure state updates happen after render
    await new Promise(resolve => setTimeout(resolve, 0));
    
    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const result = await enhancer.enhanceXCStringsQuality(strings, sourceLanguage, {
        autoApplyImprovements: options.autoApplyImprovements,
        confidenceThreshold: options.confidenceThreshold,
        focusAreas: options.focusAreas
      });

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        results: result.results,
        overallQualityScore: result.overallQualityScore,
        totalImprovements: result.totalImprovements,
        enhancedStrings: result.enhancedStrings,
        showDialog: options.showDialog ?? result.totalImprovements > 0
      }));

      return result;
    } catch (error) {
      console.error('Copy quality analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        showDialog: false
      }));
      throw error;
    }
  }, [enhancer]);

  const applyImprovements = useCallback((results: QualityEnhancementResult[]) => {
    const enhancedStrings = results.map(result => 
      result.improvedString || result.originalString
    );

    setState(prev => ({
      ...prev,
      enhancedStrings,
      showDialog: false
    }));

    return enhancedStrings;
  }, []);

  const previewChanges = useCallback((results: QualityEnhancementResult[]) => {
    // This could open a preview dialog or update a preview state
    console.log('Preview changes for:', results.length, 'strings');
    
    // For now, just log the changes
    results.forEach(result => {
      if (result.improvedString) {
        console.log('Original:', result.originalString.sourceValue);
        console.log('Improved:', result.improvedString.sourceValue);
        console.log('Suggestions:', result.suggestions.map(s => s.reason));
        console.log('---');
      }
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState(prev => ({ ...prev, showDialog: false }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isAnalyzing: false,
      results: [],
      overallQualityScore: 0,
      totalImprovements: 0,
      enhancedStrings: [],
      showDialog: false
    });
  }, []);

  return {
    state,
    analyzeStrings,
    applyImprovements,
    previewChanges,
    closeDialog,
    resetState
  };
}

export default useCopyQualityEnhancement;