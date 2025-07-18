import { useState, useEffect, useMemo, useCallback } from 'react';
import { ParsedString, TranslationStatus } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { translateMultipleLanguages } from '@/lib/openai-translator';
import { LanguageSummary } from '@/components/translator/LanguageOverviewTable';

interface SelectedCell {
  key: string;
  lang: string;
}

export function useTranslationState(
  onTranslationStart?: () => void,
  onTranslationComplete?: (success: boolean) => void,
  onTranslationProgress?: (language: string, completed: number, total: number, status: 'pending' | 'in-progress' | 'completed' | 'failed') => void
) {
  const [strings, setStrings] = useState<ParsedString[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [appContext, setAppContext] = useState<string>('');
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [fileName, setFileName] = useState<string>('Localizable.xcstrings');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [textFilter, setTextFilter] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [originalJson, setOriginalJson] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 100;
  const [isTranslationPaused, setIsTranslationPaused] = useState<boolean>(false);
  const [translationAbortController, setTranslationAbortController] = useState<AbortController | null>(null);

  // Load API key, app context, and model from localStorage on mount
  useEffect(() => {
    const storedOpenaiKey = localStorage.getItem('openai_api_key');
    if (storedOpenaiKey) {
      setOpenaiApiKey(storedOpenaiKey);
    }
    
    const storedAppContext = localStorage.getItem('app_context');
    if (storedAppContext) {
      setAppContext(storedAppContext);
    }
    
    const storedModel = localStorage.getItem('selected_model');
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  // Computed values
  const targetLanguages = useMemo(() => 
    allLanguages.filter(l => l !== sourceLanguage).sort(), 
    [allLanguages, sourceLanguage]
  );

  // Debounce text filter for better performance
  const debouncedTextFilter = useDebounce(textFilter, 300);

  const languageSummaries = useMemo(() => {
    if (strings.length === 0) return [];
    
    const summaries: { [key: string]: { 
      totalKeys: number; 
      translatedKeys: number; 
      untranslatedKeys: number;
      inProgressKeys: number;
      errorKeys: number;
      qualityReviewKeys: number;
      qualityWarningKeys: number;
      lastUpdated?: Date;
    } } = {};

    // Include all languages plus source language (Base)
    const allLanguagesWithBase = [...allLanguages];
    if (sourceLanguage && !allLanguagesWithBase.includes(sourceLanguage)) {
      allLanguagesWithBase.push(sourceLanguage);
    }

    // Initialize summaries
    allLanguagesWithBase.forEach(lang => {
      summaries[lang] = { 
        totalKeys: 0, 
        translatedKeys: 0, 
        untranslatedKeys: 0,
        inProgressKeys: 0,
        errorKeys: 0,
        qualityReviewKeys: 0,
        qualityWarningKeys: 0
      };
    });

    // Process strings in a single pass
    strings.forEach(s => {
      // Add source language data
      if (sourceLanguage && summaries[sourceLanguage]) {
        summaries[sourceLanguage].totalKeys++;
        summaries[sourceLanguage].translatedKeys++; // Source is always "translated"
      }
      
      Object.entries(s.translations).forEach(([lang, translation]) => {
        if (summaries[lang]) {
          summaries[lang].totalKeys++;
          
          switch (translation.status) {
            case 'translated':
            case 'non-translatable':
              summaries[lang].translatedKeys++;
              break;
            case 'in-progress':
              summaries[lang].inProgressKeys++;
              break;
            case 'error':
              summaries[lang].errorKeys++;
              break;
            case 'quality-review':
              summaries[lang].qualityReviewKeys++;
              break;
            case 'quality-warning':
              summaries[lang].qualityWarningKeys++;
              break;
            default:
              summaries[lang].untranslatedKeys++;
              break;
          }
        }
      });
    });

    return Object.entries(summaries).map(([language, data]): LanguageSummary => ({
      language,
      totalKeys: data.totalKeys,
      translatedKeys: data.translatedKeys,
      untranslatedKeys: data.untranslatedKeys,
      inProgressKeys: data.inProgressKeys,
      errorKeys: data.errorKeys,
      qualityReviewKeys: data.qualityReviewKeys,
      qualityWarningKeys: data.qualityWarningKeys,
      progress: data.totalKeys > 0 ? (data.translatedKeys / data.totalKeys) * 100 : 0,
      averageQuality: undefined, // TODO: Calculate from quality analysis
      lastUpdated: data.lastUpdated,
      isTranslating: false, // TODO: Track active translation state
      isPaused: false, // TODO: Track paused translation state
      estimatedTimeRemaining: undefined, // TODO: Calculate based on translation speed
    }));
  }, [strings, allLanguages, sourceLanguage]);

  // Combined filtering logic for better performance
  const filteredData = useMemo(() => {
    let currentStrings = strings;

    // Handle source language viewing
    const isViewingSourceLanguage = selectedLanguage === sourceLanguage;

    if (selectedLanguage && !isViewingSourceLanguage) {
      currentStrings = currentStrings.filter(s => s.translations[selectedLanguage]);
    }

    currentStrings = currentStrings.filter(s => {
      const textMatch = debouncedTextFilter === '' || 
                        s.key.toLowerCase().includes(debouncedTextFilter.toLowerCase()) || 
                        s.sourceValue.toLowerCase().includes(debouncedTextFilter.toLowerCase());

      if (!textMatch) return false;

      if (statusFilter === 'all') {
        return true;
      }

      // For source language, all strings are considered "translated"
      if (isViewingSourceLanguage) {
        return statusFilter === 'translated';
      }

      const targetTranslation = selectedLanguage ? s.translations[selectedLanguage] : undefined;

      if (statusFilter === 'untranslated') {
        if (selectedLanguage) {
          return targetTranslation && (targetTranslation.status === 'new' || targetTranslation.status === 'untranslated' || targetTranslation.status === 'error');
        } else {
          return Object.values(s.translations).some(t => 
            t.status === 'new' || t.status === 'untranslated' || t.status === 'error'
          );
        }
      }

      if (selectedLanguage) {
        return targetTranslation && targetTranslation.status === statusFilter;
      } else {
        return Object.values(s.translations).some(t => t.status === statusFilter);
      }
    });

    const totalPages = Math.ceil(currentStrings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStrings = currentStrings.slice(startIndex, endIndex);

    return {
      filteredStrings: paginatedStrings,
      totalFilteredPages: totalPages,
      totalFilteredCount: currentStrings.length
    };
  }, [strings, statusFilter, debouncedTextFilter, selectedLanguage, sourceLanguage, currentPage, itemsPerPage]);

  const filteredStrings = filteredData.filteredStrings;
  const totalFilteredPages = filteredData.totalFilteredPages;

  // Actions
  const handleCellClick = (key: string, lang: string) => {
    const cell: SelectedCell = { key, lang };
    const isSelected = selectedCells.some(c => c.key === key && c.lang === lang);

    if (isSelected) {
      setSelectedCells(prev => prev.filter(c => !(c.key === key && c.lang === lang)));
    } else {
      setSelectedCells(prev => [...prev, cell]);
    }
  };

  const handleBulkSelect = useCallback((cells: SelectedCell[]) => {
    setSelectedCells(cells);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCells([]);
  }, []);

  const handleSelectAll = useCallback(() => {
    const allCells: SelectedCell[] = [];
    filteredStrings.forEach(s => {
      targetLanguages.forEach(lang => {
        const translation = s.translations[lang];
        if (translation && (translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error')) {
          allCells.push({ key: s.key, lang });
        }
      });
    });
    setSelectedCells(allCells);
  }, [filteredStrings, targetLanguages]);

  const handleTranslationValueChange = useCallback((key: string, lang: string, value: string) => {
    setStrings(currentStrings => 
      currentStrings.map(s => {
        if (s.key === key) {
          const newTranslations = { ...s.translations };
          if (newTranslations[lang]) {
            newTranslations[lang].value = value;
            if (value.trim() !== '') {
              newTranslations[lang].status = 'translated';
            }
          }
          return { ...s, translations: newTranslations };
        }
        return s;
      })
    );
  }, []);

  const setRowStatus = useCallback((key: string, status: TranslationStatus) => {
    setStrings(current => current.map(s => {
      if (s.key === key) {
        const newTranslations = { ...s.translations };
        Object.keys(newTranslations).forEach(lang => {
          newTranslations[lang].status = status;
          if (status === 'non-translatable') {
            newTranslations[lang].value = s.sourceValue;
          }
        });
        return { ...s, translations: newTranslations };
      }
      return s;
    }));
  }, []);

  const copySourceToAll = useCallback((key: string, markAsTranslated: boolean = false) => {
    setStrings(current => current.map(s => {
      if (s.key === key) {
        const newTranslations = { ...s.translations };
        Object.keys(newTranslations).forEach(lang => {
          newTranslations[lang].value = s.sourceValue;
          if (markAsTranslated) {
            newTranslations[lang].status = 'translated';
          }
        });
        return { ...s, translations: newTranslations };
      }
      return s;
    }));
  }, []);

  const handleAddNewLanguage = useCallback((code: string) => {
    setAllLanguages(prev => [...prev, code].sort());
    
    setStrings(prevStrings => prevStrings.map(s => ({
      ...s,
      translations: {
        ...s.translations,
        [code]: { value: '', status: 'new' }
      }
    })));
  }, []);

  const handleFileLoad = useCallback((data: {
    strings: ParsedString[];
    languages: string[];
    sourceLanguage: string;
    originalJson: Xcstrings;
    fileName: string;
  }, isFromSavedFile?: boolean) => {
    setStrings(data.strings);
    setAllLanguages(data.languages);
    setSourceLanguage(data.sourceLanguage);
    setOriginalJson(data.originalJson);
    setFileName(data.fileName);
    setSelectedCells([]);
    
    // Clear saved file from localStorage when importing a new file (not when loading from saved)
    if (!isFromSavedFile) {
      localStorage.removeItem('translator_current_file');
    }
  }, []);

  const handleTranslateSelected = useCallback(async () => {
    if (selectedCells.length === 0) return;

    const translationsToPerform: { [lang: string]: { key: string; text: string }[] } = {};

    selectedCells.forEach(cell => {
      const stringToTranslate = strings.find(s => s.key === cell.key);
      if (stringToTranslate) {
        if (!translationsToPerform[cell.lang]) {
          translationsToPerform[cell.lang] = [];
        }
        translationsToPerform[cell.lang].push({
          key: stringToTranslate.key,
          text: stringToTranslate.sourceValue,
        });
      }
    });

    const batches = Object.entries(translationsToPerform).map(([lang, requests]) => ({
      language: lang,
      requests: requests,
    }));

    // Create abort controller for this translation
    const abortController = new AbortController();
    setTranslationAbortController(abortController);
    setIsTranslationPaused(false);

    onTranslationStart?.();

    try {
      // Update status to in-progress for selected cells
      setStrings(currentStrings =>
        currentStrings.map(s => {
          const newTranslations = { ...s.translations };
          selectedCells.forEach(cell => {
            if (s.key === cell.key && newTranslations[cell.lang]) {
              newTranslations[cell.lang].status = 'in-progress';
            }
          });
          return { ...s, translations: newTranslations };
        })
      );

      const result = await translateMultipleLanguages(
        batches,
        sourceLanguage,
        openaiApiKey,
        { model: selectedModel, appContext, abortSignal: abortController.signal },
        onTranslationProgress
      );

      setStrings(currentStrings => {
        const updatedStrings = [...currentStrings];
        result.forEach(langBatch => {
          langBatch.results.forEach(translationResult => {
            const stringIndex = updatedStrings.findIndex(s => s.key === translationResult.key);
            if (stringIndex !== -1) {
              const targetLang = langBatch.language;
              // Fix: Properly handle API errors as errors, not success
              const hasError = translationResult.error || !translationResult.translatedText;
              updatedStrings[stringIndex].translations = {
                ...updatedStrings[stringIndex].translations,
                [targetLang]: {
                  value: translationResult.translatedText || '',
                  status: hasError ? 'error' : 'translated',
                },
              };
            }
          });
        });
        return updatedStrings;
      });

      setSelectedCells([]); // Clear selection after translation
      setTranslationAbortController(null);
      onTranslationComplete?.(true);
    } catch (error) {
      console.error('Batch translation failed:', error);
      
      // Check if it was cancelled
      const wasCancelled = error instanceof Error && error.message.includes('cancelled');
      
      // Revert status to error for selected cells on failure (unless cancelled)
      if (!wasCancelled) {
        setStrings(currentStrings =>
          currentStrings.map(s => {
            const newTranslations = { ...s.translations };
            selectedCells.forEach(cell => {
              if (s.key === cell.key && newTranslations[cell.lang] && newTranslations[cell.lang].status === 'in-progress') {
                newTranslations[cell.lang].status = 'error';
              }
            });
            return { ...s, translations: newTranslations };
          })
        );
      } else {
        // If cancelled, revert to previous status
        setStrings(currentStrings =>
          currentStrings.map(s => {
            const newTranslations = { ...s.translations };
            selectedCells.forEach(cell => {
              if (s.key === cell.key && newTranslations[cell.lang] && newTranslations[cell.lang].status === 'in-progress') {
                newTranslations[cell.lang].status = 'untranslated';
              }
            });
            return { ...s, translations: newTranslations };
          })
        );
      }
      
      setTranslationAbortController(null);
      setIsTranslationPaused(false);
      onTranslationComplete?.(false);
    }
  }, [selectedCells, strings, sourceLanguage, openaiApiKey, selectedModel, appContext, onTranslationStart, onTranslationComplete, onTranslationProgress]);

  const handleSelectLanguage = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
    setSelectedCells([]);
  }, []);

  const handleClearSelectedLanguage = useCallback(() => {
    setSelectedLanguage(null);
    setCurrentPage(1);
    setSelectedCells([]);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePauseTranslation = useCallback(() => {
    setIsTranslationPaused(true);
  }, []);

  const handleResumeTranslation = useCallback(() => {
    setIsTranslationPaused(false);
  }, []);

  const handleStopTranslation = useCallback(() => {
    if (translationAbortController) {
      translationAbortController.abort();
      setTranslationAbortController(null);
      setIsTranslationPaused(false);
    }
  }, [translationAbortController]);

  // Calculate translation progress for header - optimized
  const translationStats = useMemo(() => {
    if (strings.length === 0) return { translated: 0, total: 0 };
    
    let totalCells = 0;
    let translatedCells = 0;
    
    // Single pass calculation
    strings.forEach(str => {
      const translations = Object.values(str.translations);
      totalCells += translations.length;
      translatedCells += translations.filter(t => t.status === 'translated').length;
    });
    
    return { translated: translatedCells, total: totalCells };
  }, [strings]);

  return {
    // State
    strings,
    setStrings,
    sourceLanguage,
    allLanguages,
    openaiApiKey,
    setOpenaiApiKey,
    appContext,
    setAppContext,
    selectedCells,
    setSelectedCells,
    fileName,
    statusFilter,
    setStatusFilter,
    textFilter,
    setTextFilter,
    selectedModel,
    setSelectedModel,
    originalJson,
    selectedLanguage,
    currentPage,
    isTranslationPaused,
    translationAbortController,
    
    // Computed
    targetLanguages,
    filteredStrings,
    languageSummaries,
    totalFilteredPages,
    translationStats,
    
    // Actions
    handleCellClick,
    handleTranslationValueChange,
    setRowStatus,
    copySourceToAll,
    handleAddNewLanguage,
    handleFileLoad,
    handleBulkSelect,
    handleClearSelection,
    handleSelectAll,
    handleTranslateSelected,
    handleSelectLanguage,
    handleClearSelectedLanguage,
    handlePageChange,
    handlePauseTranslation,
    handleResumeTranslation,
    handleStopTranslation,
  };
}