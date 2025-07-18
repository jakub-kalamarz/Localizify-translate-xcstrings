import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QualityAnalysis } from '@/types';

interface QualityBadgeProps {
  analysis: QualityAnalysis;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

export function QualityBadge({ 
  analysis, 
  size = 'md', 
  showScore = true,
  className 
}: QualityBadgeProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const label = getQualityLabel(analysis.score);
  const colorClasses = getQualityColor(analysis.score);

  return (
    <Badge
      className={cn(
        'font-medium border',
        colorClasses,
        sizeClasses[size],
        className
      )}
    >
      {label}
      {showScore && (
        <span className="ml-1 opacity-75">
          {analysis.score}%
        </span>
      )}
    </Badge>
  );
}

interface QualityScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QualityScore({ score, size = 'md', className }: QualityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span 
      className={cn(
        'font-mono font-semibold',
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      {score}%
    </span>
  );
}