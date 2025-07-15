'use client';

import { useTransition, useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { FloatingProgressBar } from './FloatingProgressBar';
import { LanguageOverviewTable } from './LanguageOverviewTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { useTranslationState } from './hooks/useTranslationState';
import { useKeyboardShortcuts, createTranslationShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function TranslatorPageNew() {
  const [isPending, startTransition] = useTransition();
  const [isFullwidth, setIsFullwidth] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgressItem[]>([]);
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
      if (existingIndex !== -1) {
        const newProgress = [...prev];
        const currentItem = newProgress[existingIndex];
        
        // Calculate failed count based on the difference when status is completed
        const failed = status === 'completed' ? Math.max(0, total - completed) : currentItem.failed;
        
        newProgress[existingIndex] = { 
          ...currentItem, 
          completed: status === 'failed' ? 0 : completed, 
          total, 
          status,
          failed: status === 'failed' ? total : failed
        };
        return newProgress;
      } else {
        return [...prev, { 
          language, 
          completed: status === 'failed' ? 0 : completed, 
          total, 
          status, 
          failed: status === 'failed' ? total : 0 
        }];
      }
    });
  }, []);

  const onTranslationComplete = useCallback((success: boolean) => {
    const totalCompleted = translationProgress.reduce((sum, r) => sum + r.completed, 0);
    const totalFailed = translationProgress.reduce((sum, r) => sum + r.failed, 0);

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
    // Keep dialog open longer to ensure user sees it
    setTimeout(() => setShowProgressDialog(false), 5000);
    // Keep floating progress bar open for 10 seconds after completion
    setTimeout(() => setShowFloatingProgress(false), 10000);
  }, [toast, translationProgress]);

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
  } = useTranslationState(onTranslationStart, onTranslationComplete, onTranslationProgress);

  // Load fullwidth preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('translator_fullwidth');
    if (saved) {
      setIsFullwidth(JSON.parse(saved));
    }
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

  // Keyboard shortcuts
  const shortcuts = useMemo(() => createTranslationShortcuts({
    onTranslate: handleTranslateSelected,
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,
    onExport: handleExport,
    onImport: () => document.getElementById('file-input')?.click(),
    onSave: handleExport, // Use export as save for now
  }), [handleTranslateSelected, handleSelectAll, handleClearSelection, handleExport]);

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
      setTranslationProgress([{ language, total: untranslatedStringsForLanguage.length, completed: 0, failed: 0, status: 'in-progress' }]);
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
      <div className="bg-background border-b border-border sticky top-0 z-50">
        <div className={`${isFullwidth ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 py-6`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/90 rounded-2xl flex items-center justify-center shadow-lg">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Localizify</h1>
                <p className="text-sm text-muted-foreground">
                  Import, view, and translate .xcstrings files with AI
                  
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileUpload onFileLoad={handleFileLoad} />
              <Button 
                onClick={handleExport} 
                variant="outline" 
                disabled={strings.length === 0}
                className="rounded-xl"
              >
                <Download className="mr-2 h-4 w-4" /> Export File
              </Button>
              <AddLanguageDialog 
                allLanguages={allLanguages} 
                onAddLanguage={handleAddNewLanguage}
                disabled={strings.length === 0}
              />
              <Button
                onClick={toggleFullwidth}
                variant="outline"
                size="icon"
                className="rounded-xl"
                title={isFullwidth ? 'Exit fullwidth' : 'Enable fullwidth'}
              >
                {isFullwidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <SettingsDialog 
                apiKey={openaiApiKey} 
                onApiKeyChange={setOpenaiApiKey}
                appContext={appContext}
                onAppContextChange={setAppContext}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
              <KeyboardShortcutsDialog shortcuts={shortcuts} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      
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
      
      <TranslationProgressDialog
        isOpen={showProgressDialog}
        progress={translationProgress}
        onClose={() => setShowProgressDialog(false)}
      />
      
      <FloatingProgressBar
        isVisible={showFloatingProgress}
        progress={translationProgress}
        onClose={() => setShowFloatingProgress(false)}
        onViewDetails={() => setShowProgressDialog(true)}
      />
    </div>
  );
}