
import { ParsedString, TranslationStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Play, Pause, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getLanguageData } from '@/lib/language-data';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface LanguageSummary {
  language: string;
  totalKeys: number;
  translatedKeys: number;
  untranslatedKeys: number;
  inProgressKeys: number;
  errorKeys: number;
  qualityReviewKeys: number;
  qualityWarningKeys: number;
  progress: number;
  averageQuality?: number;
  lastUpdated?: Date;
  isTranslating: boolean;
  isPaused: boolean;
  estimatedTimeRemaining?: number;
}

interface LanguageOverviewTableProps {
  languageSummaries: LanguageSummary[];
  sourceLanguage: string;
  onSelectLanguage: (language: string) => void;
  onTranslateLanguage: (language: string) => void;
  onPauseTranslation?: (language: string) => void;
  onResumeTranslation?: (language: string) => void;
  onRetryErrors?: (language: string) => void;
}

export function LanguageOverviewTable({
  languageSummaries,
  sourceLanguage,
  onSelectLanguage,
  onTranslateLanguage,
  onPauseTranslation,
  onResumeTranslation,
  onRetryErrors,
}: LanguageOverviewTableProps) {
  return (
    <div className="relative overflow-x-auto rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {languageSummaries.map((summary) => {
            const isSourceLanguage = summary.language === sourceLanguage;
            const languageData = getLanguageData(summary.language);
            const displayName = isSourceLanguage ? 'Base' : (languageData?.name || summary.language);
            
            // Calculate status indicators
            const hasErrors = summary.errorKeys > 0;
            const hasQualityIssues = summary.qualityReviewKeys > 0 || summary.qualityWarningKeys > 0;
            const inProgress = summary.inProgressKeys > 0;
            const isComplete = summary.progress >= 100;
            
            // Format time remaining
            const formatTimeRemaining = (minutes?: number) => {
              if (!minutes) return null;
              if (minutes < 60) return `${Math.round(minutes)}m`;
              const hours = Math.floor(minutes / 60);
              const remainingMinutes = Math.round(minutes % 60);
              return `${hours}h ${remainingMinutes}m`;
            };
            
            return (
              <TableRow key={summary.language} className={cn(
                summary.isTranslating && "bg-blue-50 border-blue-200",
                hasErrors && "bg-red-50 border-red-200"
              )}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {languageData?.flag} {displayName}
                    {isSourceLanguage && <Badge variant="secondary" className="text-xs">Source</Badge>}
                    {summary.isTranslating && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              {summary.isPaused ? (
                                <Pause className="h-3 w-3 text-yellow-600 animate-pulse" />
                              ) : (
                                <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{summary.isPaused ? 'Translation paused' : 'Translation in progress'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {hasErrors && <XCircle className="h-4 w-4 text-red-600" />}
                      {inProgress && !hasErrors && <Clock className="h-4 w-4 text-blue-600" />}
                      {hasQualityIssues && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                      <span className="text-sm">
                        {summary.translatedKeys} / {summary.totalKeys}
                      </span>
                    </div>
                    {summary.estimatedTimeRemaining && summary.isTranslating && (
                      <span className="text-xs text-muted-foreground">
                        ETA: {formatTimeRemaining(summary.estimatedTimeRemaining)}
                      </span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={summary.progress} 
                      className={cn(
                        "h-2 flex-grow",
                        hasErrors && "bg-red-100",
                        summary.isTranslating && "bg-blue-100"
                      )}
                    />
                    <span className="text-sm text-muted-foreground min-w-[40px]">
                      {summary.progress.toFixed(0)}%
                    </span>
                  </div>
                  {summary.inProgressKeys > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      {summary.inProgressKeys} translating
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  {summary.averageQuality !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-16 rounded-full",
                        summary.averageQuality >= 80 ? "bg-green-500" :
                        summary.averageQuality >= 60 ? "bg-yellow-500" :
                        "bg-red-500"
                      )} />
                      <span className="text-sm">{summary.averageQuality.toFixed(0)}%</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {summary.errorKeys > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {summary.errorKeys} errors
                      </Badge>
                    )}
                    {summary.qualityReviewKeys > 0 && (
                      <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                        {summary.qualityReviewKeys} review
                      </Badge>
                    )}
                    {summary.qualityWarningKeys > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                        {summary.qualityWarningKeys} warnings
                      </Badge>
                    )}
                    {!hasErrors && !hasQualityIssues && isComplete && (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        Complete
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {summary.lastUpdated && (
                    <div className="text-sm text-muted-foreground">
                      {summary.lastUpdated.toLocaleDateString()}
                      <br />
                      <span className="text-xs">
                        {summary.lastUpdated.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {!isSourceLanguage && (
                      <>
                        {summary.isTranslating ? (
                          <>
                            {summary.isPaused ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => onResumeTranslation?.(summary.language)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resume translation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => onPauseTranslation?.(summary.language)}
                                      className="text-yellow-600 hover:text-yellow-700"
                                    >
                                      <Pause className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Pause translation</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onTranslateLanguage(summary.language)}
                            className="mr-2"
                            disabled={summary.untranslatedKeys === 0 && summary.errorKeys === 0 && summary.inProgressKeys === 0}
                          >
                            Translate
                          </Button>
                        )}
                        
                        {summary.errorKeys > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => onRetryErrors?.(summary.language)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Retry failed translations</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </>
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={() => onSelectLanguage(summary.language)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
