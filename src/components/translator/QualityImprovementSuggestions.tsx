import { useState } from 'react';
import { Lightbulb, ChevronRight, ChevronDown, Copy, CheckCircle } from 'lucide-react';
import { QualityAnalysis, QualityIssue } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QualityImprovementSuggestionsProps {
  analysis: QualityAnalysis;
  originalText: string;
  onApplySuggestion?: (improvedText: string) => void;
  className?: string;
}

export function QualityImprovementSuggestions({ 
  analysis, 
  originalText, 
  onApplySuggestion,
  className 
}: QualityImprovementSuggestionsProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState<number[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const toggleSuggestion = (index: number) => {
    setExpandedSuggestions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const applySuggestion = (suggestion: string, index: number) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(index));
      toast({
        title: "Suggestion Applied",
        description: "The text has been updated with the suggested improvement.",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "The suggestion has been copied to your clipboard.",
    });
  };

  const getIssueTypeColor = (type: QualityIssue['type']) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      consistency: 'bg-purple-100 text-purple-800',
      formatting: 'bg-gray-100 text-gray-800',
      context: 'bg-green-100 text-green-800',
      length: 'bg-yellow-100 text-yellow-800',
      placeholders: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: QualityIssue['severity']) => {
    const colors = {
      high: 'border-red-200 bg-red-50',
      medium: 'border-yellow-200 bg-yellow-50',
      low: 'border-blue-200 bg-blue-50',
    };
    return colors[severity] || 'border-gray-200 bg-gray-50';
  };

  // Generate improvement suggestions based on issues
  const generateImprovementSuggestions = () => {
    const suggestions: Array<{
      type: 'rewrite' | 'fix' | 'format';
      title: string;
      description: string;
      improvedText: string;
      issues: QualityIssue[];
    }> = [];

    // Group issues by type
    const issuesByType = analysis.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, QualityIssue[]>);

    // Generate suggestions for clarity issues
    if (issuesByType.clarity) {
      const clarityIssues = issuesByType.clarity;
      let improvedText = originalText;
      
      // Apply clarity improvements
      if (clarityIssues.some(issue => issue.message.includes('passive voice'))) {
        improvedText = improvedText.replace(/\b(was|were|is|are)\s+(\w+ed)\b/gi, (match, verb, word) => {
          return `actively ${word.replace(/ed$/, '')}`;
        });
      }
      
      suggestions.push({
        type: 'rewrite',
        title: 'Improve Clarity',
        description: 'Make the text more clear and direct by using active voice and simpler language.',
        improvedText,
        issues: clarityIssues,
      });
    }

    // Generate suggestions for formatting issues
    if (issuesByType.formatting) {
      const formattingIssues = issuesByType.formatting;
      let improvedText = originalText;
      
      // Apply formatting fixes
      improvedText = improvedText.replace(/\s+/g, ' '); // Fix double spaces
      improvedText = improvedText.trim(); // Remove leading/trailing spaces
      
      // Fix capitalization
      improvedText = improvedText.replace(/^([a-z])/, (match, letter) => letter.toUpperCase());
      
      suggestions.push({
        type: 'format',
        title: 'Fix Formatting',
        description: 'Clean up spacing, punctuation, and capitalization issues.',
        improvedText,
        issues: formattingIssues,
      });
    }

    // Generate suggestions for length issues
    if (issuesByType.length) {
      const lengthIssues = issuesByType.length;
      let improvedText = originalText;
      
      // If text is too long, suggest condensing
      if (lengthIssues.some(issue => issue.message.includes('long'))) {
        // Simple condensing - remove redundant words
        improvedText = improvedText
          .replace(/\bin order to\b/gi, 'to')
          .replace(/\bdue to the fact that\b/gi, 'because')
          .replace(/\bat this point in time\b/gi, 'now')
          .replace(/\bfor the purpose of\b/gi, 'to');
      }
      
      suggestions.push({
        type: 'rewrite',
        title: 'Optimize Length',
        description: 'Make the text more concise while preserving meaning.',
        improvedText,
        issues: lengthIssues,
      });
    }

    return suggestions;
  };

  const improvementSuggestions = generateImprovementSuggestions();

  if (analysis.issues.length === 0 && analysis.score >= 80) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Great job! This text meets quality standards.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Quality Improvement Suggestions
        </CardTitle>
        <CardDescription>
          Based on the analysis, here are some suggestions to improve your copy quality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Issues Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Issues Found ({analysis.issues.length})</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.issues.map((issue, index) => (
              <Badge
                key={index}
                variant="outline"
                className={cn("text-xs", getIssueTypeColor(issue.type))}
              >
                {issue.type} - {issue.severity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Improvement Suggestions */}
        {improvementSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Suggested Improvements</h4>
            {improvementSuggestions.map((suggestion, index) => (
              <Card key={index} className={cn("border", getSeverityColor('medium'))}>
                <Collapsible 
                  open={expandedSuggestions.includes(index)}
                  onOpenChange={() => toggleSuggestion(index)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.type}
                          </Badge>
                          <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {appliedSuggestions.has(index) && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {expandedSuggestions.includes(index) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {suggestion.description}
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Original vs Improved */}
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">Original:</div>
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                            {originalText}
                          </div>
                          <div className="text-xs text-muted-foreground">Improved:</div>
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            {suggestion.improvedText}
                          </div>
                        </div>

                        {/* Related Issues */}
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">Addresses these issues:</div>
                          <div className="space-y-1">
                            {suggestion.issues.map((issue, issueIndex) => (
                              <div key={issueIndex} className="text-xs p-2 bg-muted/50 rounded">
                                <span className="font-medium">{issue.message}</span>
                                {issue.suggestion && (
                                  <div className="text-muted-foreground mt-1">
                                    {issue.suggestion}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => applySuggestion(suggestion.improvedText, index)}
                            disabled={appliedSuggestions.has(index)}
                          >
                            {appliedSuggestions.has(index) ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-2" />
                                Applied
                              </>
                            ) : (
                              'Apply Suggestion'
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyToClipboard(suggestion.improvedText)}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}

        {/* General Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">General Recommendations</h4>
            <div className="space-y-1">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}