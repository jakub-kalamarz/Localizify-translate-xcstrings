import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Pause,
  Play,
  AlertTriangle,
  TrendingUp,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EnhancedTranslationProgressItem {
  language: string;
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';
  errors?: Array<{
    key: string;
    message: string;
    retryable: boolean;
  }>;
  speed?: number; // translations per minute
  eta?: number; // estimated time remaining in minutes
  qualityScore?: number;
  startTime?: Date;
  endTime?: Date;
}

interface EnhancedTranslationProgressDialogProps {
  isOpen: boolean;
  progress: EnhancedTranslationProgressItem[];
  onClose?: () => void;
  onPauseLanguage?: (language: string) => void;
  onResumeLanguage?: (language: string) => void;
  onRetryLanguage?: (language: string) => void;
  onRetryError?: (language: string, key: string) => void;
  canPause?: boolean;
  canRetry?: boolean;
}

export function EnhancedTranslationProgressDialog({ 
  isOpen, 
  progress, 
  onClose,
  onPauseLanguage,
  onResumeLanguage,
  onRetryLanguage,
  onRetryError,
  canPause = false,
  canRetry = false
}: EnhancedTranslationProgressDialogProps) {
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(new Set());

  const totalItems = progress.reduce((sum, item) => sum + item.total, 0);
  const completedItems = progress.reduce((sum, item) => sum + item.completed, 0);
  const failedItems = progress.reduce((sum, item) => sum + item.failed, 0);
  const successfulItems = completedItems - failedItems;
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const successRate = completedItems > 0 ? (successfulItems / completedItems) * 100 : 0;
  
  const isCompleted = completedItems + failedItems === totalItems && totalItems > 0;
  const hasErrors = failedItems > 0;
  const isInProgress = progress.some(item => item.status === 'in-progress');
  const isPaused = progress.some(item => item.status === 'paused');

  // Calculate overall ETA
  const overallETA = progress.reduce((total, item) => {
    return total + (item.eta || 0);
  }, 0);

  // Calculate average speed
  const averageSpeed = progress.reduce((total, item) => {
    return total + (item.speed || 0);
  }, 0) / progress.length;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return null;
    const end = endTime || new Date();
    const durationMs = end.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    return formatTime(minutes);
  };

  const toggleLanguageExpansion = (language: string) => {
    setExpandedLanguages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(language)) {
        newSet.delete(language);
      } else {
        newSet.add(language);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: EnhancedTranslationProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: EnhancedTranslationProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in-progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'paused':
        return 'outline';
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isCompleted && isInProgress && <Loader2 className="h-5 w-5 animate-spin" />}
            {isPaused && <Pause className="h-5 w-5 text-yellow-500" />}
            {hasErrors && <AlertTriangle className="h-5 w-5 text-red-500" />}
            Translation Progress
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? `Translation completed: ${successfulItems} successful, ${failedItems} failed`
              : isPaused
              ? `Translation paused: ${completedItems} of ${totalItems} completed`
              : `Translating ${totalItems} items across ${progress.length} languages`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Progress</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isInProgress && averageSpeed > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {averageSpeed.toFixed(1)}/min
                  </div>
                )}
                {overallETA > 0 && isInProgress && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    ETA: {formatTime(overallETA)}
                  </div>
                )}
              </div>
            </div>
            <Progress 
              value={overallProgress} 
              className={cn(
                "h-3",
                hasErrors && "bg-red-100",
                isPaused && "bg-yellow-100"
              )}
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {completedItems} / {totalItems} completed
              </span>
              {completedItems > 0 && (
                <span className={cn(
                  "font-medium",
                  getQualityColor(successRate)
                )}>
                  {successRate.toFixed(1)}% success rate
                </span>
              )}
            </div>
          </div>

          {/* Language Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Languages</h4>
              {hasErrors && canRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    progress.forEach(item => {
                      if (item.failed > 0) {
                        onRetryLanguage?.(item.language);
                      }
                    });
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry All Errors
                </Button>
              )}
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {progress.map((item) => {
                const isExpanded = expandedLanguages.has(item.language);
                const hasErrors = item.errors && item.errors.length > 0;
                const successfulCount = item.completed - item.failed;
                const itemProgress = item.total > 0 ? (item.completed / item.total) * 100 : 0;
                
                return (
                  <div
                    key={item.language}
                    className={cn(
                      "border rounded-lg",
                      item.status === 'failed' && "border-red-200 bg-red-50",
                      item.status === 'paused' && "border-yellow-200 bg-yellow-50",
                      item.status === 'in-progress' && "border-blue-200 bg-blue-50"
                    )}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.language}</span>
                        <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                          {item.status}
                        </Badge>
                        {item.qualityScore && (
                          <span className={cn("text-xs", getQualityColor(item.qualityScore))}>
                            Q: {item.qualityScore.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Action buttons */}
                        <div className="flex gap-1">
                          {item.status === 'in-progress' && canPause && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onPauseLanguage?.(item.language)}
                              className="h-6 w-6 p-0"
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          {item.status === 'paused' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onResumeLanguage?.(item.language)}
                              className="h-6 w-6 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          {item.failed > 0 && canRetry && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onRetryLanguage?.(item.language)}
                              className="h-6 w-6 p-0"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Progress info */}
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {successfulCount}
                            {item.failed > 0 && (
                              <span className="text-red-500"> (+{item.failed} failed)</span>
                            )}
                            /{item.total}
                          </div>
                          {item.speed && item.status === 'in-progress' && (
                            <div className="text-xs text-muted-foreground">
                              {item.speed.toFixed(1)}/min
                            </div>
                          )}
                          {item.eta && item.status === 'in-progress' && (
                            <div className="text-xs text-muted-foreground">
                              ETA: {formatTime(item.eta)}
                            </div>
                          )}
                        </div>
                        
                        <div className="w-20">
                          <Progress 
                            value={itemProgress} 
                            className="h-1" 
                          />
                        </div>
                        
                        {/* Expand/collapse button */}
                        {(hasErrors || item.startTime) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLanguageExpansion(item.language)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expandable content */}
                    <Collapsible open={isExpanded}>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-2">
                          {/* Duration info */}
                          {item.startTime && (
                            <div className="text-xs text-muted-foreground">
                              Duration: {formatDuration(item.startTime, item.endTime)}
                            </div>
                          )}
                          
                          {/* Error details */}
                          {hasErrors && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-red-600">
                                Errors ({item.errors?.length}):
                              </div>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {item.errors?.map((error, index) => (
                                  <div key={index} className="flex items-start justify-between text-xs bg-red-50 p-2 rounded">
                                    <div className="flex-1">
                                      <div className="font-medium">{error.key}</div>
                                      <div className="text-muted-foreground">{error.message}</div>
                                    </div>
                                    {error.retryable && canRetry && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRetryError?.(item.language, error.key)}
                                        className="h-5 w-5 p-0"
                                      >
                                        <RefreshCw className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}