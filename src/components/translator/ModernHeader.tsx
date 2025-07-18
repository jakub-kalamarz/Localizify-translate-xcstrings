'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Download, 
  Upload, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Plus, 
  Keyboard, 
  ChevronDown,
  FileText,
  Languages,
  Zap,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '../theme-toggle';
import { FileUpload } from './FileUpload';
import { SettingsDialog } from './SettingsDialog';
import { AddLanguageDialog } from './AddLanguageDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { cn } from '@/lib/utils';

interface ModernHeaderProps {
  // File & data
  fileName: string;
  strings: ParsedString[];
  allLanguages: string[];
  selectedLanguage: string | null;
  
  // Translation stats
  translationStats: { translated: number; total: number };
  isTranslating: boolean;
  translationProgress?: number;
  
  // Settings
  openaiApiKey: string;
  appContext: string;
  selectedModel: string;
  isFullwidth: boolean;
  
  // Actions
  onFileLoad: (data: any) => void;
  onExport: () => void;
  onAddNewLanguage: (code: string) => void;
  onToggleFullwidth: () => void;
  onApiKeyChange: (key: string) => void;
  onAppContextChange: (context: string) => void;
  onModelChange: (model: string) => void;
  onClearSelectedLanguage?: () => void;
  
  // Keyboard shortcuts
  shortcuts: { key: string; label: string; action: () => void; }[];
}

export function ModernHeader({
  fileName,
  strings,
  sourceLanguage,
  allLanguages,
  selectedLanguage,
  translationStats,
  isTranslating,
  translationProgress,
  openaiApiKey,
  appContext,
  selectedModel,
  isFullwidth,
  onFileLoad,
  onExport,
  onAddNewLanguage,
  onToggleFullwidth,
  onApiKeyChange,
  onAppContextChange,
  onModelChange,
  onClearSelectedLanguage,
  shortcuts
}: ModernHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasFile = strings.length > 0;
  const progressPercentage = translationStats.total > 0 
    ? (translationStats.translated / translationStats.total) * 100 
    : 0;

  return (
    <TooltipProvider>
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-in-out",
        "backdrop-blur-xl bg-background/80 border-b border-border/50",
        isScrolled && "shadow-lg bg-background/95"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          isFullwidth ? "max-w-full px-8" : "max-w-7xl px-6"
        )}>
          <div className="flex items-center justify-between h-16">
            {/* Left: Branding & Context */}
            <div className="flex items-center gap-6">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-primary/10">
                    <Globe className="h-5 w-5 text-primary-foreground" />
                  </div>
                  {isTranslating && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full animate-pulse">
                      <div className="h-full w-full bg-blue-400 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Localizify
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    AI-powered translation studio
                  </p>
                </div>
              </div>

              {/* Context Info */}
              {hasFile && (
                <div className="hidden md:flex items-center gap-4">
                  <div className="h-8 w-px bg-border" />
                  
                  {/* File Info */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {strings.length} keys
                    </Badge>
                  </div>

                  {/* Language Info */}
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {allLanguages.length} languages
                    </span>
                    {selectedLanguage && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onClearSelectedLanguage}
                          className="h-6 px-2 text-xs"
                        >
                          {selectedLanguage}
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Progress Info */}
                  {translationStats.total > 0 && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {translationStats.translated}/{translationStats.total}
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Primary Actions */}
              <div className="flex items-center gap-1">
                <FileUpload onFileLoad={onFileLoad} />
                <Button
                  onClick={onExport}
                  disabled={!hasFile}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-2" />

              {/* Secondary Actions */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowAddLanguage(true)}
                      disabled={!hasFile}
                      className="rounded-xl hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Language</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleFullwidth}
                      className="rounded-xl hover:bg-accent"
                    >
                      {isFullwidth ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullwidth ? 'Exit Fullwidth' : 'Fullwidth Mode'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-6 w-px bg-border mx-2" />

              {/* Utility Actions */}
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      API Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}>
                      <Keyboard className="h-4 w-4 mr-2" />
                      Keyboard Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Info className="h-4 w-4 mr-2" />
                      About
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Translation Progress Bar */}
          {isTranslating && translationProgress !== undefined && (
            <div className="pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Translating...</span>
                <span className="text-xs text-muted-foreground">
                  {translationProgress.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={translationProgress} 
                className="h-1 bg-muted"
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          apiKey={openaiApiKey}
          onApiKeyChange={onApiKeyChange}
          appContext={appContext}
          onAppContextChange={onAppContextChange}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />

        <KeyboardShortcutsDialog
          open={showKeyboardShortcuts}
          onOpenChange={setShowKeyboardShortcuts}
          shortcuts={shortcuts}
        />

        <AddLanguageDialog
          open={showAddLanguage}
          onOpenChange={setShowAddLanguage}
          allLanguages={allLanguages}
          onAddLanguage={onAddNewLanguage}
          disabled={!hasFile}
        />
      </header>
    </TooltipProvider>
  );
}