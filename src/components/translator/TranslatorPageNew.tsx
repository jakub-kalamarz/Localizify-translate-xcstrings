'use client';

import { useTransition, useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Download, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { translateStringsAction } from '@/app/actions';
import { translateMultipleLanguages, TranslationBatchRequest, TranslationBatchResult } from '@/lib/openai-translator';
import { ThemeToggle } from '../theme-toggle';

// Component imports
import { FileUpload, EmptyState } from './FileUpload';
import { TranslationTable } from './TranslationTable';
import { TranslationControls } from './TranslationControls';
import { SettingsDialog } from './SettingsDialog';
import { AddLanguageDialog } from './AddLanguageDialog';
import { BulkSelectionControls } from './BulkSelectionControls';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { TranslationProgressDialog, TranslationProgressItem } from './TranslationProgressDialog';
import { EnhancedTranslationProgressDialog, EnhancedTranslationProgressItem } from './EnhancedTranslationProgressDialog';
import { FloatingProgressBar } from './FloatingProgressBar';
import { EnhancedFloatingProgressBar } from './EnhancedFloatingProgressBar';
import { LanguageOverviewTable } from './LanguageOverviewTable';
import { ModernHeader } from './ModernHeader';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { useTranslationState } from './hooks/useTranslationState';
import { useKeyboardShortcuts, createTranslationShortcuts } from '@/hooks/useKeyboardShortcuts';
import { translationCache } from '@/lib/translation-cache';
import { CopyQualityEnhancementDialog } from './CopyQualityEnhancementDialog';
import { useCopyQualityEnhancement } from '@/hooks/useCopyQualityEnhancement';
import { scheduleStateUpdate } from '@/utils/async-utils';

const TranslatorPageNew = memo(function TranslatorPageNew() {
  const [isPending, startTransition] = useTransition();
  const [isFullwidth, setIsFullwidth] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<EnhancedTranslationProgressItem[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showFloatingProgress, setShowFloatingProgress] = useState(false);
  const hasLoadedInitialFile = useRef(false);
  const { toast } = useToast();
  
  const onTranslationStart = useCallback(() => {
    setTranslationProgress([]);
    setShowProgressDialog(true);
    setShowFloatingProgress(true);
    startTransition(() => {}); // Indicate pending state
  }, []);

  const onTranslationProgress = useCallback((language: string, completed: number, total: number, status: 'pending' | 'in-progress' | 'completed' | 'failed') => {
    setTranslationProgress(prev => {
      const existingIndex = prev.findIndex(item => item.language === language);
      const now = new Date();
      
      if (existingIndex !== -1) {
        const newProgress = [...prev];
        const currentItem = newProgress[existingIndex];
        
        // Calculate failed count based on the difference when status is completed
        const failed = status === 'completed' ? Math.max(0, total - completed) : currentItem.failed;
        
        // Calculate speed (items per minute)
        const timeDiff = currentItem.startTime ? (now.getTime() - currentItem.startTime.getTime()) / 1000 / 60 : 0;
        const speed = timeDiff > 0 ? completed / timeDiff : 0;
        
        // Calculate ETA (estimated time remaining in minutes)
        const remaining = total - completed;
        const eta = speed > 0 ? remaining / speed : 0;
        
        newProgress[existingIndex] = { 
          ...currentItem, 
          completed: status === 'failed' ? 0 : completed, 
          total, 
          status: status === 'completed' && failed > 0 ? 'failed' : status,
          failed: status === 'failed' ? total : failed,
          speed: speed > 0 ? speed : currentItem.speed,
          eta: eta > 0 ? eta : undefined,
          endTime: status === 'completed' || status === 'failed' ? now : undefined
        };
        return newProgress;
      } else {
        return [...prev, { 
          language, 
          completed: status === 'failed' ? 0 : completed, 
          total, 
          status: status === 'completed' && total - completed > 0 ? 'failed' : status,
          failed: status === 'failed' ? total : 0,
          startTime: now,
          speed: 0,
          eta: undefined
        }];
      }
    });
  }, []);

  const onTranslationComplete = useCallback((success: boolean) => {
    setTranslationProgress(current => {
      const totalCompleted = current.reduce((sum, r) => sum + r.completed, 0);
      const totalFailed = current.reduce((sum, r) => sum + r.failed, 0);

      if (success) {
        toast({ 
          title: 'Translation Complete',
          description: `${totalCompleted} successful, ${totalFailed} failed`
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Translation Failed', 
          description: 'Please check your API key and try again.' 
        });
      }
      return current;
    });
    
    // Keep dialog open longer to ensure user sees it
    setTimeout(() => setShowProgressDialog(false), 5000);
    // Keep floating progress bar open for 10 seconds after completion
    setTimeout(() => setShowFloatingProgress(false), 10000);
  }, [toast]);

  const {
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
    targetLanguages,
    filteredStrings,
    languageSummaries,
    selectedLanguage,
    currentPage,
    totalFilteredPages,
    translationStats,
    isTranslationPaused,
    translationAbortController,
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
  } = useTranslationState(onTranslationStart, onTranslationComplete, onTranslationProgress);

  // Copy quality enhancement
  const {
    state: qualityState,
    analyzeStrings,
    applyImprovements,
    previewChanges,
    closeDialog: closeQualityDialog,
    resetState: resetQualityState
  } = useCopyQualityEnhancement({
    enabled: true,
    autoAnalyze: true,
    minScore: 70
  });

  // Load fullwidth preference from localStorage and setup cache maintenance
  useEffect(() => {
    const saved = localStorage.getItem('translator_fullwidth');
    if (saved) {
      setIsFullwidth(JSON.parse(saved));
    }
    
    // Setup periodic cache maintenance
    const maintenanceInterval = setInterval(() => {
      translationCache.performMaintenance();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(maintenanceInterval);
  }, []);

  // Save current file data to localStorage
  useEffect(() => {
    if (strings.length > 0) {
      const fileData = {
        strings,
        sourceLanguage,
        allLanguages,
        fileName,
        originalJson,
        timestamp: Date.now(),
      };
      localStorage.setItem('translator_current_file', JSON.stringify(fileData));
    }
  }, [strings, sourceLanguage, allLanguages, fileName, originalJson]);

  // Load saved file data on mount
  useEffect(() => {
    if (hasLoadedInitialFile.current) return;
    
    const savedFile = localStorage.getItem('translator_current_file');
    if (savedFile) {
      try {
        const fileData = JSON.parse(savedFile);
        // Only restore if it's recent (within 24 hours)
        if (Date.now() - fileData.timestamp < 24 * 60 * 60 * 1000) {
          // Use the original handleFileLoad, not the enhanced one, to avoid quality analysis on saved files
          handleFileLoad({
            strings: fileData.strings,
            languages: fileData.allLanguages,
            sourceLanguage: fileData.sourceLanguage,
            originalJson: fileData.originalJson,
            fileName: fileData.fileName,
          }, true); // Pass true to indicate this is from saved file
          hasLoadedInitialFile.current = true;
        }
      } catch (error) {
        console.error('Error loading saved file:', error);
      }
    }
  }, [handleFileLoad]);

  // Enhanced file load with quality analysis
  const handleFileLoadWithQuality = useCallback((data: any, isFromSavedFile?: boolean) => {
    // First load the file normally
    handleFileLoad(data, isFromSavedFile);
    
    // Then analyze quality if it's a new file (not from saved)
    // Use scheduleStateUpdate to avoid state updates during render
    if (!isFromSavedFile && data.strings && data.strings.length > 0) {
      scheduleStateUpdate(async () => {
        try {
          await analyzeStrings(data.strings, data.sourceLanguage, {
            showDialog: true,
            focusAreas: ['clarity', 'consistency', 'formatting']
          });
        } catch (error) {
          console.error('Quality analysis failed:', error);
          // Don't block file loading if quality analysis fails
        }
      });
    }
  }, [handleFileLoad, analyzeStrings]);

  const updateOriginalJsonWithCurrentState = useCallback(() => {
    if (!originalJson) return null;

    const newJson = JSON.parse(JSON.stringify(originalJson));
    newJson.sourceLanguage = sourceLanguage;
    const languages = new Set<string>([sourceLanguage]);

    strings.forEach(s => {
      if (!newJson.strings[s.key]) {
        newJson.strings[s.key] = {
          localizations: {},
        };
      }
      if (s.comment) {
        newJson.strings[s.key].comment = s.comment;
      }
      
      const localizations = newJson.strings[s.key].localizations || {};

      Object.entries(s.translations).forEach(([lang, translation]) => {
        languages.add(lang);
        const hasValue = translation.value && translation.value.trim() !== '';

        if (translation.status === 'translated' && hasValue) {
          localizations[lang] = { stringUnit: { state: 'translated', value: translation.value } };
        } else if (translation.status === 'non-translatable' && s.sourceValue) {
          localizations[lang] = { stringUnit: { state: 'translated', value: s.sourceValue } };
        } else if (hasValue) {
          localizations[lang] = { stringUnit: { state: 'new', value: translation.value } };
        } else {
          delete localizations[lang];
        }
      });
      newJson.strings[s.key].localizations = localizations;
    });

    return newJson;
  }, [originalJson, sourceLanguage, strings]);

  const handleExport = useCallback(() => {
    const updatedJson = updateOriginalJsonWithCurrentState();
    if (!updatedJson) {
      toast({ variant: 'destructive', title: 'Nothing to export', description: 'Load a file first.' });
      return;
    }
    
    const blob = new Blob([JSON.stringify(updatedJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'File exported successfully' });
  }, [updateOriginalJsonWithCurrentState, fileName, toast]);

  // Save fullwidth preference to localStorage
  const toggleFullwidth = useCallback(() => {
    const newValue = !isFullwidth;
    setIsFullwidth(newValue);
    localStorage.setItem('translator_fullwidth', JSON.stringify(newValue));
  }, [isFullwidth]);

  // Keyboard shortcuts - stable references
  const keyboardHandlers = useMemo(() => ({
    onTranslate: handleTranslateSelected,
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,
    onExport: handleExport,
    onImport: () => document.getElementById('file-input')?.click(),
    onSave: handleExport, // Use export as save for now
  }), [handleTranslateSelected, handleSelectAll, handleClearSelection, handleExport]);
  
  const shortcuts = useMemo(() => createTranslationShortcuts(keyboardHandlers), [keyboardHandlers]);

  useKeyboardShortcuts(shortcuts, strings.length > 0);

  const handleTranslateLanguage = useCallback(async (language: string) => {
    if (!openaiApiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Missing',
        description: 'Please set your OpenAI API key in Settings.',
      });
      return;
    }

    const untranslatedStringsForLanguage = strings.filter(s =>
      s.translations[language] &&
      (s.translations[language].status === 'new' ||
        s.translations[language].status === 'untranslated' ||
        s.translations[language].status === 'error' ||
        s.translations[language].status === 'in-progress')
    ).map(s => ({
      key: s.key,
      text: s.sourceValue,
    }));

    if (untranslatedStringsForLanguage.length === 0) {
      toast({
        title: 'No untranslated strings',
        description: `All strings in ${language} are already translated or marked as non-translatable.`,
      });
      return;
    }

    const batches = [{
      language: language,
      requests: untranslatedStringsForLanguage,
    }];

    // Show progress dialog and floating progress bar immediately
    setShowProgressDialog(true);
    setShowFloatingProgress(true);
    setTimeout(() => {
      setTranslationProgress([{ 
        language, 
        total: untranslatedStringsForLanguage.length, 
        completed: 0, 
        failed: 0, 
        status: 'in-progress',
        startTime: new Date(),
        speed: 0,
        eta: undefined
      }]);
    }, 10);
    
    // Start translation after a small delay to ensure dialog is visible
    setTimeout(() => {
      startTransition(async () => {
        try {
        // Optimistically update status to in-progress
        setStrings(currentStrings =>
          currentStrings.map(s => {
            const newTranslations = { ...s.translations };
            if (newTranslations[language] &&
                (newTranslations[language].status === 'new' ||
                 newTranslations[language].status === 'untranslated' ||
                 newTranslations[language].status === 'error' ||
                 newTranslations[language].status === 'in-progress')) {
              newTranslations[language].status = 'in-progress';
            }
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
          result.forEach((langBatch: TranslationBatchResult) => {
            langBatch.results.forEach((translationResult: { key: string; translatedText: string; error?: string; }) => {
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
        onTranslationComplete(true);
      } catch (error) {
        console.error('Batch translation failed:', error);
        // Revert status to error for selected cells on failure
        setStrings(currentStrings =>
          currentStrings.map(s => {
            const newTranslations = { ...s.translations };
            if (newTranslations[language] && newTranslations[language].status === 'in-progress') {
              newTranslations[language].status = 'error';
            }
            return { ...s, translations: newTranslations };
          })
        );
        onTranslationComplete(false);
      }
    });
    }, 50); // Small delay to ensure dialog shows
  }, [strings, sourceLanguage, openaiApiKey, selectedModel, appContext, onTranslationProgress, setStrings, toast]);

  return (
    <div className="min-h-screen bg-muted/50">
      <ModernHeader
        fileName={fileName}
        strings={strings}
        sourceLanguage={sourceLanguage}
        allLanguages={allLanguages}
        selectedLanguage={selectedLanguage}
        translationStats={translationStats}
        isTranslating={!!translationAbortController}
        translationProgress={translationProgress.length > 0 ? translationProgress[0].completed / translationProgress[0].total * 100 : undefined}
        openaiApiKey={openaiApiKey}
        appContext={appContext}
        selectedModel={selectedModel}
        isFullwidth={isFullwidth}
        onFileLoad={handleFileLoadWithQuality}
        onExport={handleExport}
        onAddNewLanguage={handleAddNewLanguage}
        onToggleFullwidth={toggleFullwidth}
        onApiKeyChange={setOpenaiApiKey}
        onAppContextChange={setAppContext}
        onModelChange={setSelectedModel}
        onClearSelectedLanguage={handleClearSelectedLanguage}
        shortcuts={shortcuts}
      />
      
      <div className={`${isFullwidth ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 py-8`}>
        {strings.length === 0 ? (
          <div className="bg-background rounded-2xl shadow-sm border border-border p-12">
            <EmptyState onImportClick={() => document.getElementById('file-input')?.click()} />
          </div>
        ) : (
          <div className="space-y-6">
            {selectedLanguage ? (
              <div className="space-y-6">
                <Button variant="outline" onClick={handleClearSelectedLanguage}>
                  ← Back to Language Overview
                </Button>
                <div className="bg-background rounded-2xl shadow-sm border border-border p-6">
                  <BulkSelectionControls
                    strings={strings}
                    filteredStrings={filteredStrings}
                    targetLanguages={targetLanguages}
                    selectedCells={selectedCells}
                    onBulkSelect={handleBulkSelect}
                    onClearSelection={handleClearSelection}
                  />
                </div>
                <div className="bg-background rounded-2xl shadow-sm border border-border p-6">
                  <TranslationControls
                    textFilter={textFilter}
                    onTextFilterChange={setTextFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    selectedCellsCount={selectedCells.length}
                    onTranslate={handleTranslateSelected}
                    isPending={isPending}
                    hasApiKey={!!openaiApiKey}
                    hasActiveTranslations={showFloatingProgress}
                  />
                </div>
                <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
                  <TranslationTable
                    sourceLanguage={sourceLanguage}
                    targetLanguages={targetLanguages}
                    selectedCells={selectedCells}
                    onCellClick={handleCellClick}
                    onTranslationValueChange={handleTranslationValueChange}
                    onCopySourceToAll={copySourceToAll}
                    onSetRowStatus={setRowStatus}
                    filteredStrings={filteredStrings}
                    selectedLanguage={selectedLanguage}
                  />
                </div>
                {totalFilteredPages > 1 && (
                  <div className="flex justify-center py-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              href="#" 
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === totalFilteredPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-background rounded-2xl shadow-sm border border-border p-6">
                  <LanguageOverviewTable
                    languageSummaries={languageSummaries}
                    sourceLanguage={sourceLanguage}
                    onSelectLanguage={handleSelectLanguage}
                    onTranslateLanguage={handleTranslateLanguage}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <EnhancedTranslationProgressDialog
        isOpen={showProgressDialog}
        progress={translationProgress}
        onClose={() => setShowProgressDialog(false)}
        canPause={!!translationAbortController}
        canRetry={true}
      />
      
      <EnhancedFloatingProgressBar
        isVisible={showFloatingProgress}
        progress={translationProgress}
        onClose={() => setShowFloatingProgress(false)}
        onViewDetails={() => setShowProgressDialog(true)}
        onPause={handlePauseTranslation}
        onResume={handleResumeTranslation}
        onStop={handleStopTranslation}
        isPaused={isTranslationPaused}
        canPause={!!translationAbortController}
      />

      <CopyQualityEnhancementDialog
        isOpen={qualityState.showDialog}
        onClose={closeQualityDialog}
        results={qualityState.results}
        overallQualityScore={qualityState.overallQualityScore}
        totalImprovements={qualityState.totalImprovements}
        onApplyImprovements={applyImprovements}
        onPreviewChanges={previewChanges}
        loading={qualityState.isAnalyzing}
      />
    </div>
  );
});

export default TranslatorPageNew;