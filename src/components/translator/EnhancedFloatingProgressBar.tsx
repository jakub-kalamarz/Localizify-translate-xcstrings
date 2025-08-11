import { useState } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Pause, 
  Play, 
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EnhancedTranslationProgressItem } from './EnhancedTranslationProgressDialog';

interface EnhancedFloatingProgressBarProps {
  isVisible: boolean;
  progress: EnhancedTranslationProgressItem[];
  onClose: () => void;
  onViewDetails: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  isPaused?: boolean;
  canPause?: boolean;
  className?: string;
}

export function EnhancedFloatingProgressBar({
  isVisible,
  progress,
  onClose,
  onViewDetails,
  onPause,
  onResume,
  onStop,
  isPaused = false,
  canPause = false,
  className
}: EnhancedFloatingProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const totalItems = progress.reduce((sum, item) => sum + item.total, 0);
  const completedItems = progress.reduce((sum, item) => sum + item.completed, 0);
  const failedItems = progress.reduce((sum, item) => sum + item.failed, 0);
  const successfulItems = completedItems - failedItems;
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  const isCompleted = completedItems + failedItems === totalItems && totalItems > 0;
  const hasErrors = failedItems > 0;
  const isInProgress = progress.some(item => item.status === 'in-progress');
  const pausedLanguages = progress.filter(item => item.status === 'paused').length;
  const activeLanguages = progress.filter(item => item.status === 'in-progress').length;

  // Calculate overall speed and ETA
  const averageSpeed = progress.reduce((total, item) => total + (item.speed || 0), 0) / progress.length;
  const overallETA = progress.reduce((total, item) => total + (item.eta || 0), 0);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = () => {
    if (hasErrors) return 'border-red-200 bg-red-50';
    if (isPaused) return 'border-yellow-200 bg-yellow-50';
    if (isInProgress) return 'border-blue-200 bg-blue-50';
    if (isCompleted) return 'border-green-200 bg-green-50';
    return 'border-border bg-muted';
  };

  const getProgressColor = () => {
    if (hasErrors) return 'bg-red-100';
    if (isPaused) return 'bg-yellow-100';
    if (isInProgress) return 'bg-blue-100';
    return 'bg-green-100';
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isExpanded ? "w-80" : "w-64",
        className
      )}>
        <Card className={cn("border-2 shadow-lg", getStatusColor())}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {hasErrors && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {isPaused && <Pause className="h-4 w-4 text-yellow-600" />}
                  {isInProgress && <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse" />}
                  <span className="text-sm font-medium">
                    {isCompleted ? 'Complete' : isPaused ? 'Paused' : 'Translating'}
                  </span>
                </div>
                
                {/* Status badges */}
                <div className="flex gap-1">
                  {activeLanguages > 0 && (
                    <Badge variant="outline" className="text-xs px-1">
                      {activeLanguages} active
                    </Badge>
                  )}
                  {pausedLanguages > 0 && (
                    <Badge variant="outline" className="text-xs px-1 text-yellow-700">
                      {pausedLanguages} paused
                    </Badge>
                  )}
                  {hasErrors && (
                    <Badge variant="destructive" className="text-xs px-1">
                      {failedItems} errors
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="h-6 w-6 p-0"
                    >
                      {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isExpanded ? 'Minimize' : 'Expand'}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={overallProgress} 
                className={cn("h-2", getProgressColor())}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{successfulItems} / {totalItems}</span>
                <span>{overallProgress.toFixed(0)}%</span>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-3 space-y-3">
                {/* Performance metrics */}
                {isInProgress && (
                  <div className="flex justify-between text-xs">
                    {averageSpeed > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{averageSpeed.toFixed(1)}/min</span>
                      </div>
                    )}
                    {overallETA > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>ETA: {formatTime(overallETA)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Language breakdown */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Languages:</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {progress.map((item) => (
                      <div key={item.language} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            item.status === 'completed' && "bg-green-500",
                            item.status === 'in-progress' && "bg-blue-500 animate-pulse",
                            item.status === 'paused' && "bg-yellow-500",
                            item.status === 'failed' && "bg-red-500",
                            item.status === 'pending' && "bg-muted-foreground"
                          )} />
                          <span>{item.language}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            {item.completed - item.failed}/{item.total}
                          </span>
                          {item.failed > 0 && (
                            <span className="text-red-500">+{item.failed}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewDetails}
                    className="flex-1 text-xs"
                  >
                    View Details
                  </Button>
                  
                  {canPause && !isCompleted && (
                    <div className="flex gap-1">
                      {isPaused ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onResume}
                              className="h-7 w-7 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resume translation</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onPause}
                              className="h-7 w-7 p-0"
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pause translation</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onStop}
                            className="h-7 w-7 p-0"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Stop translation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}