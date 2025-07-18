import { useState, useMemo } from 'react';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { ParsedString } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { QualityDashboard } from './QualityDashboard';

interface QualityReportsDialogProps {
  strings: ParsedString[];
  selectedLanguage?: string | null;
}

export function QualityReportsDialog({ strings, selectedLanguage }: QualityReportsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const reportData = useMemo(() => {
    const data = {
      totalStrings: strings.length,
      analyzedStrings: 0,
      averageScore: 0,
      issuesByType: {} as Record<string, number>,
      languageBreakdown: {} as Record<string, { analyzed: number; averageScore: number }>,
      recommendations: [] as string[],
    };

    let totalScore = 0;
    let scoreCount = 0;

    strings.forEach(string => {
      // Source quality
      if (string.sourceQuality) {
        data.analyzedStrings++;
        totalScore += string.sourceQuality.score;
        scoreCount++;

        string.sourceQuality.issues.forEach(issue => {
          data.issuesByType[issue.type] = (data.issuesByType[issue.type] || 0) + 1;
        });
      }

      // Translation quality
      Object.entries(string.translations).forEach(([lang, translation]) => {
        if (translation.quality) {
          if (!data.languageBreakdown[lang]) {
            data.languageBreakdown[lang] = { analyzed: 0, averageScore: 0 };
          }
          data.languageBreakdown[lang].analyzed++;
          data.languageBreakdown[lang].averageScore += translation.quality.score;

          translation.quality.issues.forEach(issue => {
            data.issuesByType[issue.type] = (data.issuesByType[issue.type] || 0) + 1;
          });
        }
      });
    });

    // Calculate averages
    if (scoreCount > 0) {
      data.averageScore = Math.round(totalScore / scoreCount);
    }

    Object.keys(data.languageBreakdown).forEach(lang => {
      const langData = data.languageBreakdown[lang];
      if (langData.analyzed > 0) {
        langData.averageScore = Math.round(langData.averageScore / langData.analyzed);
      }
    });

    // Generate recommendations
    const topIssues = Object.entries(data.issuesByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topIssues.length > 0) {
      data.recommendations.push(`Focus on ${topIssues[0][0]} issues - found in ${topIssues[0][1]} strings`);
    }

    if (data.averageScore < 70) {
      data.recommendations.push('Consider reviewing your copy quality guidelines');
    }

    if (data.analyzedStrings < data.totalStrings * 0.5) {
      data.recommendations.push('Run quality analysis on more strings for better insights');
    }

    return data;
  }, [strings]);

  const exportReport = () => {
    const reportContent = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStrings: reportData.totalStrings,
        analyzedStrings: reportData.analyzedStrings,
        averageScore: reportData.averageScore,
        analysisCompleteness: Math.round((reportData.analyzedStrings / reportData.totalStrings) * 100),
      },
      issuesByType: reportData.issuesByType,
      languageBreakdown: reportData.languageBreakdown,
      recommendations: reportData.recommendations,
      detailedStrings: strings.map(string => ({
        key: string.key,
        sourceValue: string.sourceValue,
        sourceQuality: string.sourceQuality ? {
          score: string.sourceQuality.score,
          issues: string.sourceQuality.issues.map(issue => ({
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
          })),
        } : null,
        translations: Object.entries(string.translations).map(([lang, translation]) => ({
          language: lang,
          value: translation.value,
          status: translation.status,
          quality: translation.quality ? {
            score: translation.quality.score,
            issues: translation.quality.issues.map(issue => ({
              type: issue.type,
              severity: issue.severity,
              message: issue.message,
            })),
          } : null,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Exported',
      description: 'Quality report has been downloaded as JSON file.',
    });
  };

  const exportCSV = () => {
    const csvRows = [
      ['Key', 'Source Text', 'Source Quality Score', 'Source Issues', 'Language', 'Translation', 'Translation Quality Score', 'Translation Issues', 'Status']
    ];

    strings.forEach(string => {
      const sourceIssues = string.sourceQuality?.issues.map(i => `${i.type}:${i.severity}`).join(';') || '';
      const sourceScore = string.sourceQuality?.score || '';

      Object.entries(string.translations).forEach(([lang, translation]) => {
        const translationIssues = translation.quality?.issues.map(i => `${i.type}:${i.severity}`).join(';') || '';
        const translationScore = translation.quality?.score || '';

        csvRows.push([
          string.key,
          string.sourceValue,
          sourceScore.toString(),
          sourceIssues,
          lang,
          translation.value,
          translationScore.toString(),
          translationIssues,
          translation.status,
        ]);
      });
    });

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Report Exported',
      description: 'Quality report has been downloaded as CSV file.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Quality Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Copy Quality Reports
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <QualityDashboard strings={strings} selectedLanguage={selectedLanguage} />
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <span className="font-semibold">{reportData.averageScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analysis Coverage:</span>
                      <span className="font-semibold">
                        {Math.round((reportData.analyzedStrings / reportData.totalStrings) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(reportData.analyzedStrings / reportData.totalStrings) * 100} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(reportData.issuesByType)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <Badge variant="outline" className="capitalize">
                            {type}
                          </Badge>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {Object.keys(reportData.languageBreakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Language Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportData.languageBreakdown).map(([lang, data]) => (
                      <div key={lang} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <span className="font-medium">{lang}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({data.analyzed} analyzed)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={data.averageScore} className="w-20" />
                          <span className="font-semibold">{data.averageScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reportData.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download your quality analysis data in different formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">JSON Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete quality analysis data with detailed scores and issues
                    </p>
                    <Button onClick={exportReport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">CSV Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Spreadsheet-friendly format for analysis and sharing
                    </p>
                    <Button onClick={exportCSV} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded">
                  <h4 className="font-medium mb-2">Report Contents</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Overall quality metrics and scores</li>
                    <li>• Issue breakdown by type and severity</li>
                    <li>• Language-specific quality analysis</li>
                    <li>• Detailed string-by-string analysis</li>
                    <li>• Actionable recommendations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}