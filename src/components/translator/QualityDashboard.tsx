import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3, PieChart } from 'lucide-react';
import { ParsedString, QualityAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QualityBadge } from '@/components/ui/quality-badge';
import { cn } from '@/lib/utils';

interface QualityDashboardProps {
  strings: ParsedString[];
  selectedLanguage?: string | null;
  className?: string;
}

export function QualityDashboard({ strings, selectedLanguage, className }: QualityDashboardProps) {
  const qualityMetrics = useMemo(() => {
    const metrics = {
      totalStrings: 0,
      analyzedStrings: 0,
      averageScore: 0,
      highQualityCount: 0,
      mediumQualityCount: 0,
      lowQualityCount: 0,
      issuesByType: {} as Record<string, number>,
      readabilityDistribution: {} as Record<string, number>,
      consistencyScore: 0,
    };

    let totalScore = 0;
    let consistencyScores = 0;

    strings.forEach(string => {
      // Analyze source quality
      if (string.sourceQuality) {
        metrics.totalStrings++;
        metrics.analyzedStrings++;
        totalScore += string.sourceQuality.score;
        consistencyScores += string.sourceQuality.consistency.terminologyScore;
        
        // Categorize by quality level
        if (string.sourceQuality.score >= 80) {
          metrics.highQualityCount++;
        } else if (string.sourceQuality.score >= 60) {
          metrics.mediumQualityCount++;
        } else {
          metrics.lowQualityCount++;
        }

        // Count issues by type
        string.sourceQuality.issues.forEach(issue => {
          metrics.issuesByType[issue.type] = (metrics.issuesByType[issue.type] || 0) + 1;
        });

        // Count readability distribution
        const grade = string.sourceQuality.readability.grade;
        metrics.readabilityDistribution[grade] = (metrics.readabilityDistribution[grade] || 0) + 1;
      }

      // Analyze translation quality if specific language selected
      if (selectedLanguage && string.translations[selectedLanguage]?.quality) {
        const translationQuality = string.translations[selectedLanguage].quality!;
        metrics.totalStrings++;
        metrics.analyzedStrings++;
        totalScore += translationQuality.score;
        consistencyScores += translationQuality.consistency.terminologyScore;
        
        // Categorize by quality level
        if (translationQuality.score >= 80) {
          metrics.highQualityCount++;
        } else if (translationQuality.score >= 60) {
          metrics.mediumQualityCount++;
        } else {
          metrics.lowQualityCount++;
        }

        // Count issues by type
        translationQuality.issues.forEach(issue => {
          metrics.issuesByType[issue.type] = (metrics.issuesByType[issue.type] || 0) + 1;
        });

        // Count readability distribution
        const grade = translationQuality.readability.grade;
        metrics.readabilityDistribution[grade] = (metrics.readabilityDistribution[grade] || 0) + 1;
      }
    });

    if (metrics.analyzedStrings > 0) {
      metrics.averageScore = Math.round(totalScore / metrics.analyzedStrings);
      metrics.consistencyScore = Math.round(consistencyScores / metrics.analyzedStrings);
    }

    return metrics;
  }, [strings, selectedLanguage]);

  const getQualityTrend = () => {
    // This would typically compare with previous analysis
    // For now, we'll use a simple heuristic based on current quality
    if (qualityMetrics.averageScore >= 75) {
      return { direction: 'up', label: 'Trending Up', color: 'text-green-600' };
    } else if (qualityMetrics.averageScore >= 50) {
      return { direction: 'stable', label: 'Stable', color: 'text-yellow-600' };
    } else {
      return { direction: 'down', label: 'Needs Attention', color: 'text-red-600' };
    }
  };

  const getIssueTypeColor = (type: string) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      consistency: 'bg-purple-100 text-purple-800',
      formatting: 'bg-gray-100 text-gray-800',
      context: 'bg-green-100 text-green-800',
      length: 'bg-yellow-100 text-yellow-800',
      placeholders: 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getReadabilityColor = (grade: string) => {
    const colors = {
      elementary: 'bg-green-100 text-green-800',
      middle: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      college: 'bg-orange-100 text-orange-800',
      graduate: 'bg-red-100 text-red-800',
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const trend = getQualityTrend();

  if (qualityMetrics.analyzedStrings === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5" />
            <p className="text-sm">No quality analysis data available. Enable quality analysis and analyze your strings to see insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{qualityMetrics.averageScore}%</div>
              <div className={cn("flex items-center gap-1", trend.color)}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">{trend.label}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analyzed Strings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.analyzedStrings}</div>
            <p className="text-xs text-muted-foreground">
              of {strings.length} total strings
            </p>
            <Progress 
              value={(qualityMetrics.analyzedStrings / strings.length) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {qualityMetrics.highQualityCount}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((qualityMetrics.highQualityCount / qualityMetrics.analyzedStrings) * 100)}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {qualityMetrics.mediumQualityCount + qualityMetrics.lowQualityCount}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((qualityMetrics.mediumQualityCount + qualityMetrics.lowQualityCount) / qualityMetrics.analyzedStrings) * 100)}% of analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Quality Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of quality levels across analyzed strings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">High Quality (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{qualityMetrics.highQualityCount}</span>
                <Progress 
                  value={(qualityMetrics.highQualityCount / qualityMetrics.analyzedStrings) * 100} 
                  className="w-20 h-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Medium Quality (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{qualityMetrics.mediumQualityCount}</span>
                <Progress 
                  value={(qualityMetrics.mediumQualityCount / qualityMetrics.analyzedStrings) * 100} 
                  className="w-20 h-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Low Quality (0-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{qualityMetrics.lowQualityCount}</span>
                <Progress 
                  value={(qualityMetrics.lowQualityCount / qualityMetrics.analyzedStrings) * 100} 
                  className="w-20 h-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Breakdown */}
      {Object.keys(qualityMetrics.issuesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
            <CardDescription>
              Most frequent quality issues found in your copy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(qualityMetrics.issuesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={cn("", getIssueTypeColor(type))}
                  >
                    {type}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Readability Distribution */}
      {Object.keys(qualityMetrics.readabilityDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Readability Levels</CardTitle>
            <CardDescription>
              Distribution of reading difficulty across your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(qualityMetrics.readabilityDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([grade, count]) => (
                  <Badge
                    key={grade}
                    variant="outline"
                    className={cn("capitalize", getReadabilityColor(grade))}
                  >
                    {grade}: {count}
                  </Badge>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ideal for most apps: Elementary to Middle school level
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consistency Score */}
      <Card>
        <CardHeader>
          <CardTitle>Consistency Score</CardTitle>
          <CardDescription>
            How consistent your terminology and style is across all content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{qualityMetrics.consistencyScore}%</div>
            <Progress value={qualityMetrics.consistencyScore} className="flex-1" />
            <Badge variant={qualityMetrics.consistencyScore >= 80 ? "default" : "destructive"}>
              {qualityMetrics.consistencyScore >= 80 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}