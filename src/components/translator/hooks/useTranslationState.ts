import { useState, useEffect, useMemo, useCallback } from 'react';
import { ParsedString, TranslationStatus } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { translateMultipleLanguages } from '@/lib/openai-translator';

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
    const summaries: { [key: string]: { totalKeys: number; translatedKeys: number; untranslatedKeys: number; } } = {};

    // Include all languages plus source language (Base)
    const allLanguagesWithBase = [...allLanguages];
    if (sourceLanguage && !allLanguagesWithBase.includes(sourceLanguage)) {
      allLanguagesWithBase.push(sourceLanguage);
    }

    allLanguagesWithBase.forEach(lang => {
      summaries[lang] = { totalKeys: 0, translatedKeys: 0, untranslatedKeys: 0 };
    });

    strings.forEach(s => {
      // Add source language data
      if (sourceLanguage && summaries[sourceLanguage]) {
        summaries[sourceLanguage].totalKeys++;
        summaries[sourceLanguage].translatedKeys++; // Source is always "translated"
      }
      
      Object.entries(s.translations).forEach(([lang, translation]) => {
        if (summaries[lang]) {
          summaries[lang].totalKeys++;
          if (translation.status === 'translated' || translation.status === 'non-translatable') {
            summaries[lang].translatedKeys++;
          } else {
            summaries[lang].untranslatedKeys++;
          }
        }
      });
    });

    return Object.entries(summaries).map(([language, data]) => ({
      language,
      totalKeys: data.totalKeys,
      translatedKeys: data.translatedKeys,
      untranslatedKeys: data.untranslatedKeys,
      progress: data.totalKeys > 0 ? (data.translatedKeys / data.totalKeys) * 100 : 0,
    }));
  }, [strings, allLanguages, sourceLanguage]);

  const filteredStrings = useMemo(() => {
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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentStrings.slice(startIndex, endIndex);
  }, [strings, statusFilter, debouncedTextFilter, selectedLanguage, sourceLanguage, currentPage, itemsPerPage]);

  const totalFilteredPages = useMemo(() => {
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
    return Math.ceil(currentStrings.length / itemsPerPage);
  }, [strings, statusFilter, debouncedTextFilter, selectedLanguage, sourceLanguage, itemsPerPage]);

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
    originalJson: any;
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
        { model: selectedModel, appContext },
        onTranslationProgress
      );

      setStrings(currentStrings => {
        const updatedStrings = [...currentStrings];
        result.forEach(langBatch => {
          langBatch.results.forEach(translationResult => {
            const stringIndex = updatedStrings.findIndex(s => s.key === translationResult.key);
            if (stringIndex !== -1) {
              const targetLang = langBatch.language;
              updatedStrings[stringIndex].translations = {
                ...updatedStrings[stringIndex].translations,
                [targetLang]: {
                  value: translationResult.translatedText || '',
                  status: translationResult.error ? 'error' : 'translated',
                },
              };
            }
          });
        });
        return updatedStrings;
      });

      setSelectedCells([]); // Clear selection after translation
      onTranslationComplete?.(true);
    } catch (error) {
      console.error('Batch translation failed:', error);
      // Revert status to error for selected cells on failure
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
      onTranslationComplete?.(false);
    }
  }, [selectedCells, strings, sourceLanguage, openaiApiKey, selectedModel, appContext, onTranslationStart, onTranslationComplete]);

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

  // Calculate translation progress for header
  const translationStats = useMemo(() => {
    if (strings.length === 0) return { translated: 0, total: 0 };
    
    const totalCells = strings.reduce((sum, str) => {
      return sum + Object.keys(str.translations).length;
    }, 0);
    
    const translatedCells = strings.reduce((sum, str) => {
      return sum + Object.values(str.translations).filter(t => t.status === 'translated').length;
    }, 0);
    
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
  };
}