import { useState, useCallback, useEffect } from 'react';
import { QualitySettings, QualityAnalysis, ParsedString } from '@/types';
import { copyQualityAnalyzer } from '@/lib/copy-quality-analyzer';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_QUALITY_SETTINGS: QualitySettings = {
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

export function useQualityAnalysis() {
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(DEFAULT_QUALITY_SETTINGS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Load quality settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('quality_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setQualitySettings({ ...DEFAULT_QUALITY_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading quality settings:', error);
      }
    }
  }, []);

  // Save quality settings to localStorage
  const updateQualitySettings = useCallback((settings: QualitySettings) => {
    setQualitySettings(settings);
    localStorage.setItem('quality_settings', JSON.stringify(settings));
  }, []);

  // Analyze single text string
  const analyzeText = useCallback(async (
    text: string,
    allStrings?: ParsedString[]
  ): Promise<QualityAnalysis | null> => {
    if (!qualitySettings.enabled || !text.trim()) {
      return null;
    }

    try {
      const analysis = await copyQualityAnalyzer.analyzeText(text, {
        settings: qualitySettings,
        allStrings,
      });
      return analysis;
    } catch (error) {
      console.error('Quality analysis error:', error);
      return null;
    }
  }, [qualitySettings]);

  // Analyze translation against source
  const analyzeTranslation = useCallback(async (
    sourceText: string,
    translationText: string,
    targetLanguage: string,
    allStrings?: ParsedString[]
  ): Promise<QualityAnalysis | null> => {
    if (!qualitySettings.enabled || !translationText.trim()) {
      return null;
    }

    try {
      const analysis = await copyQualityAnalyzer.analyzeTranslation(
        sourceText,
        translationText,
        targetLanguage,
        {
          settings: qualitySettings,
          allStrings,
        }
      );
      return analysis;
    } catch (error) {
      console.error('Translation quality analysis error:', error);
      return null;
    }
  }, [qualitySettings]);

  // Analyze all strings in a batch
  const analyzeAllStrings = useCallback(async (
    strings: ParsedString[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<ParsedString[]> => {
    if (!qualitySettings.enabled) {
      return strings;
    }

    setIsAnalyzing(true);
    const updatedStrings = [...strings];

    try {
      // Analyze source strings
      for (let i = 0; i < strings.length; i++) {
        const string = strings[i];
        
        // Analyze source text
        if (string.sourceValue) {
          const sourceAnalysis = await analyzeText(string.sourceValue, strings);
          if (sourceAnalysis) {
            updatedStrings[i] = {
              ...updatedStrings[i],
              sourceQuality: sourceAnalysis,
            };
          }
        }

        // Analyze translations
        Object.keys(string.translations).forEach(async (lang) => {
          const translation = string.translations[lang];
          if (translation.value && translation.status === 'translated') {
            const translationAnalysis = await analyzeTranslation(
              string.sourceValue,
              translation.value,
              lang,
              strings
            );
            if (translationAnalysis) {
              updatedStrings[i].translations[lang] = {
                ...translation,
                quality: translationAnalysis,
                // Update status based on quality score
                status: translationAnalysis.score < qualitySettings.minScore 
                  ? 'quality-review' 
                  : translation.status,
              };
            }
          }
        });

        onProgress?.(i + 1, strings.length);
      }

      toast({
        title: 'Quality Analysis Complete',
        description: `Analyzed ${strings.length} strings for quality issues.`,
      });
    } catch (error) {
      console.error('Batch quality analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'There was an error analyzing your strings. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }

    return updatedStrings;
  }, [qualitySettings, analyzeText, analyzeTranslation, toast]);

  // Analyze specific string by key
  const analyzeString = useCallback(async (
    key: string,
    strings: ParsedString[],
    targetLanguage?: string
  ): Promise<ParsedString | null> => {
    if (!qualitySettings.enabled) {
      return null;
    }

    const string = strings.find(s => s.key === key);
    if (!string) {
      return null;
    }

    const updatedString = { ...string };

    try {
      // Analyze source if not already analyzed
      if (!string.sourceQuality && string.sourceValue) {
        const sourceAnalysis = await analyzeText(string.sourceValue, strings);
        if (sourceAnalysis) {
          updatedString.sourceQuality = sourceAnalysis;
        }
      }

      // Analyze specific translation if provided
      if (targetLanguage && string.translations[targetLanguage]) {
        const translation = string.translations[targetLanguage];
        if (translation.value) {
          const translationAnalysis = await analyzeTranslation(
            string.sourceValue,
            translation.value,
            targetLanguage,
            strings
          );
          if (translationAnalysis) {
            updatedString.translations[targetLanguage] = {
              ...translation,
              quality: translationAnalysis,
              status: translationAnalysis.score < qualitySettings.minScore 
                ? 'quality-review' 
                : translation.status,
            };
          }
        }
      }

      toast({
        title: 'Quality Analysis Complete',
        description: `Analyzed string "${key}" for quality issues.`,
      });

      return updatedString;
    } catch (error) {
      console.error('String quality analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: `Could not analyze string "${key}". Please try again.`,
      });
      return null;
    }
  }, [qualitySettings, analyzeText, analyzeTranslation, toast]);

  // Auto-analyze text when settings are enabled
  const autoAnalyzeText = useCallback(async (
    text: string,
    allStrings?: ParsedString[]
  ): Promise<QualityAnalysis | null> => {
    if (!qualitySettings.enabled || !qualitySettings.autoAnalyze || !text.trim()) {
      return null;
    }

    // Debounce auto-analysis to avoid excessive API calls
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const analysis = await analyzeText(text, allStrings);
          resolve(analysis);
        } catch (error) {
          console.error('Auto-analysis error:', error);
          resolve(null);
        }
      }, 1000); // 1 second debounce
    });
  }, [qualitySettings, analyzeText]);

  // Get quality statistics for dashboard
  const getQualityStats = useCallback((strings: ParsedString[]) => {
    const stats = {
      totalStrings: strings.length,
      analyzedStrings: 0,
      averageScore: 0,
      highQualityCount: 0,
      mediumQualityCount: 0,
      lowQualityCount: 0,
      commonIssues: {} as Record<string, number>,
    };

    let totalScore = 0;
    let scoreCount = 0;

    strings.forEach(string => {
      // Count source quality
      if (string.sourceQuality) {
        stats.analyzedStrings++;
        totalScore += string.sourceQuality.score;
        scoreCount++;

        if (string.sourceQuality.score >= 80) {
          stats.highQualityCount++;
        } else if (string.sourceQuality.score >= 60) {
          stats.mediumQualityCount++;
        } else {
          stats.lowQualityCount++;
        }

        // Count issues
        string.sourceQuality.issues.forEach(issue => {
          stats.commonIssues[issue.type] = (stats.commonIssues[issue.type] || 0) + 1;
        });
      }

      // Count translation quality
      Object.values(string.translations).forEach(translation => {
        if (translation.quality) {
          stats.analyzedStrings++;
          totalScore += translation.quality.score;
          scoreCount++;

          if (translation.quality.score >= 80) {
            stats.highQualityCount++;
          } else if (translation.quality.score >= 60) {
            stats.mediumQualityCount++;
          } else {
            stats.lowQualityCount++;
          }

          // Count issues
          translation.quality.issues.forEach(issue => {
            stats.commonIssues[issue.type] = (stats.commonIssues[issue.type] || 0) + 1;
          });
        }
      });
    });

    if (scoreCount > 0) {
      stats.averageScore = Math.round(totalScore / scoreCount);
    }

    return stats;
  }, []);

  return {
    qualitySettings,
    updateQualitySettings,
    analyzeText,
    analyzeTranslation,
    analyzeAllStrings,
    analyzeString,
    autoAnalyzeText,
    getQualityStats,
    isAnalyzing,
  };
}