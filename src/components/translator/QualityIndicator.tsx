import { useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { QualityAnalysis, QualityIssue } from '@/types';
import { QualityBadge } from '@/components/ui/quality-badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QualityIndicatorProps {
  analysis: QualityAnalysis;
  compact?: boolean;
  className?: string;
}

export function QualityIndicator({ 
  analysis, 
  compact = false, 
  className 
}: QualityIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIssueIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'low':
        return <Info className="h-3 w-3 text-blue-500" />;
      default:
        return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
  };

  const getIssueTypeColor = (type: QualityIssue['type']) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      consistency: 'bg-purple-100 text-purple-800',
      formatting: 'bg-muted text-muted-foreground',
      context: 'bg-green-100 text-green-800',
      length: 'bg-yellow-100 text-yellow-800',
      placeholders: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const groupedIssues = analysis.issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, QualityIssue[]>);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <QualityBadge analysis={analysis} size="sm" />
        {analysis.issues.length > 0 && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                {analysis.issues.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <QualityDetails analysis={analysis} />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <QualityBadge analysis={analysis} />
        <span className="text-sm text-muted-foreground">
          {analysis.issues.length} {analysis.issues.length === 1 ? 'issue' : 'issues'}
        </span>
      </div>
      
      {analysis.issues.length > 0 && (
        <div className="space-y-2">
          {Object.entries(groupedIssues).map(([type, issues]) => (
            <div key={type} className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getIssueTypeColor(type as QualityIssue['type']))}
              >
                {type}
              </Badge>
              <div className="flex gap-1">
                {issues.map((issue, index) => (
                  <div key={index} className="flex items-center">
                    {getIssueIcon(issue.severity)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface QualityDetailsProps {
  analysis: QualityAnalysis;
}

export function QualityDetails({ analysis }: QualityDetailsProps) {
  const getIssueIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const readabilityGradeColors = {
    elementary: 'text-green-600',
    middle: 'text-blue-600',
    high: 'text-yellow-600',
    college: 'text-orange-600',
    graduate: 'text-red-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Copy Quality Analysis</h4>
        <QualityBadge analysis={analysis} size="sm" />
      </div>

      {/* Readability Metrics */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Readability</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Reading Level:</span>
            <span className={cn("ml-2 font-medium capitalize", readabilityGradeColors[analysis.readability.grade])}>
              {analysis.readability.grade}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Score:</span>
            <span className="ml-2 font-medium">{Math.round(analysis.readability.score)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Words/Sentence:</span>
            <span className="ml-2 font-medium">{analysis.readability.averageWordsPerSentence.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Complex Words:</span>
            <span className="ml-2 font-medium">{analysis.readability.complexWords}</span>
          </div>
        </div>
      </div>

      {/* Consistency Metrics */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Consistency</h5>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Terminology:</span>
            <span className="ml-2 font-medium">{analysis.consistency.terminologyScore}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Style:</span>
            <span className="ml-2 font-medium">{analysis.consistency.styleScore}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Formatting:</span>
            <span className="ml-2 font-medium">{analysis.consistency.formattingScore}%</span>
          </div>
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Issues ({analysis.issues.length})</h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analysis.issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                {getIssueIcon(issue.severity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{issue.message}</p>
                  {issue.suggestion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {issue.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Suggestions</h5>
          <div className="space-y-1">
            {analysis.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}