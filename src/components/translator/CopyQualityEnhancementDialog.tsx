import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  FileText, 
  Wand2,
  Eye,
  Download
} from 'lucide-react';
import { ParsedString } from '@/types';
import { QualityEnhancementResult, QualityEnhancementSuggestion } from '@/lib/xcstrings-quality-enhancer';
import { cn } from '@/lib/utils';

interface CopyQualityEnhancementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: QualityEnhancementResult[];
  overallQualityScore: number;
  totalImprovements: number;
  onApplyImprovements: (results: QualityEnhancementResult[]) => void;
  onPreviewChanges: (results: QualityEnhancementResult[]) => void;
  loading?: boolean;
}

export function CopyQualityEnhancementDialog({
  isOpen,
  onClose,
  results,
  overallQualityScore,
  totalImprovements,
  onApplyImprovements,
  onPreviewChanges,
  loading = false
}: CopyQualityEnhancementDialogProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');

  const handleSuggestionToggle = (key: string, suggestionIndex: number) => {
    const suggestionId = `${key}-${suggestionIndex}`;
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allSuggestions = new Set<string>();
    results.forEach(result => {
      result.suggestions.forEach((_, index) => {
        allSuggestions.add(`${result.originalString.key}-${index}`);
      });
    });
    setSelectedSuggestions(allSuggestions);
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fix': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'improve': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'optimize': return <Wand2 className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      consistency: 'bg-purple-100 text-purple-800',
      formatting: 'bg-muted text-muted-foreground',
      context: 'bg-green-100 text-green-800',
      length: 'bg-yellow-100 text-yellow-800',
      placeholders: 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const categorizedSuggestions = results.reduce((acc, result) => {
    result.suggestions.forEach(suggestion => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = [];
      }
      acc[suggestion.category].push({
        ...suggestion,
        key: result.originalString.key,
        stringValue: result.originalString.sourceValue
      });
    });
    return acc;
  }, {} as Record<string, Array<QualityEnhancementSuggestion & { key: string; stringValue: string }>>);

  const highPriorityResults = results.filter(result => 
    result.suggestions.some(s => s.impact === 'high')
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Analyzing Copy Quality</DialogTitle>
            <DialogDescription>
              Please wait while we analyze your content for quality improvements...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Analyzing content...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Copy Quality Enhancement
          </DialogTitle>
          <DialogDescription>
            Found {totalImprovements} potential improvements across {results.length} strings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Overall Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    <span className={getQualityScoreColor(overallQualityScore)}>
                      {overallQualityScore.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={overallQualityScore} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Improvements Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{totalImprovements}</div>
                  <p className="text-sm text-muted-foreground">
                    Across {results.length} strings
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2 text-red-600">
                    {highPriorityResults.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Need immediate attention
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(categorizedSuggestions).map(([category, suggestions]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {suggestions.length} suggestions
                        </span>
                      </div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(suggestions.length / totalImprovements) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedSuggestions.size} selected
              </p>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.originalString.key}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {result.originalString.key}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.originalString.sourceValue}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-medium",
                            getQualityScoreColor(result.qualityAnalysis.score)
                          )}>
                            {result.qualityAnalysis.score.toFixed(0)}%
                          </span>
                          {result.qualityImprovement > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              +{result.qualityImprovement.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.suggestions.map((suggestion, index) => {
                          const suggestionId = `${result.originalString.key}-${index}`;
                          const isSelected = selectedSuggestions.has(suggestionId);
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-colors",
                                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                              )}
                              onClick={() => handleSuggestionToggle(result.originalString.key, index)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  {getTypeIcon(suggestion.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={getCategoryColor(suggestion.category)}>
                                      {suggestion.category}
                                    </Badge>
                                    <Badge variant="outline" className={getImpactColor(suggestion.impact)}>
                                      {suggestion.impact}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {suggestion.confidence}% confidence
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium mb-1">{suggestion.reason}</p>
                                  {suggestion.suggestedText !== suggestion.originalText && (
                                    <div className="text-xs space-y-1">
                                      <div className="text-muted-foreground">
                                        <span className="font-medium">Suggested:</span> {suggestion.suggestedText}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {Object.entries(categorizedSuggestions).map(([category, suggestions]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                        <span className="text-sm font-normal">
                          {suggestions.length} suggestions
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium">{suggestion.key}</p>
                            <p className="text-muted-foreground">{suggestion.reason}</p>
                          </div>
                        ))}
                        {suggestions.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{suggestions.length - 3} more suggestions
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="priority" className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {['high', 'medium', 'low'].map(priority => {
                  const priorityResults = results.filter(result =>
                    result.suggestions.some(s => s.impact === priority)
                  );
                  
                  if (priorityResults.length === 0) return null;
                  
                  return (
                    <Card key={priority}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Badge className={getImpactColor(priority)}>
                            {priority} priority
                          </Badge>
                          <span className="text-sm font-normal">
                            {priorityResults.length} items
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {priorityResults.slice(0, 5).map((result, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{result.originalString.key}</p>
                              <p className="text-muted-foreground">
                                {result.suggestions.filter(s => s.impact === priority)[0]?.reason}
                              </p>
                            </div>
                          ))}
                          {priorityResults.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{priorityResults.length - 5} more items
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onPreviewChanges(results)}
            disabled={selectedSuggestions.size === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
          <Button 
            onClick={() => onApplyImprovements(results)}
            disabled={selectedSuggestions.size === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Apply {selectedSuggestions.size} Improvements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}