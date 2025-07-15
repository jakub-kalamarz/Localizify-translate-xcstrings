import React from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TranslationProgressItem } from './TranslationProgressDialog';

interface FloatingProgressBarProps {
  isVisible: boolean;
  progress: TranslationProgressItem[];
  onClose: () => void;
  onViewDetails: () => void;
}

export function FloatingProgressBar({
  isVisible,
  progress,
  onClose,
  onViewDetails,
}: FloatingProgressBarProps) {
  if (!isVisible || progress.length === 0) return null;

  const totalItems = progress.reduce((sum, item) => sum + item.total, 0);
  const completedItems = progress.reduce((sum, item) => sum + item.completed, 0);
  const failedItems = progress.reduce((sum, item) => sum + item.failed, 0);
  const overallProgress = totalItems > 0 ? ((completedItems + failedItems) / totalItems) * 100 : 0;
  
  const isCompleted = completedItems + failedItems === totalItems && totalItems > 0;
  const hasErrors = failedItems > 0;
  
  const activeLanguages = progress.filter(p => p.status === 'in-progress');
  const completedLanguages = progress.filter(p => p.status === 'completed');
  const failedLanguages = progress.filter(p => p.status === 'failed');

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="w-80 shadow-lg border-l-4 border-l-blue-500 backdrop-blur-sm bg-card/95">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                hasErrors ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              )}
              <h3 className="font-semibold text-sm">
                {isCompleted 
                  ? 'Translation Complete' 
                  : 'Translating...'
                }
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completedItems + failedItems} / {totalItems}</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {activeLanguages.length > 0 && (
                  <span className="text-blue-600">
                    {activeLanguages.length} active
                  </span>
                )}
                {completedLanguages.length > 0 && (
                  <span className="text-green-600 ml-2">
                    {completedLanguages.length} done
                  </span>
                )}
                {failedLanguages.length > 0 && (
                  <span className="text-red-600 ml-2">
                    {failedLanguages.length} failed
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetails}
                className="h-6 px-2 text-xs text-primary hover:text-primary/80"
              >
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}