
import { ParsedString, TranslationStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { getLanguageData } from '@/lib/language-data';
import { Progress } from '@/components/ui/progress';

export interface LanguageSummary {
  language: string;
  totalKeys: number;
  translatedKeys: number;
  untranslatedKeys: number;
  progress: number;
}

interface LanguageOverviewTableProps {
  languageSummaries: LanguageSummary[];
  sourceLanguage: string;
  onSelectLanguage: (language: string) => void;
  onTranslateLanguage: (language: string) => void;
}

export function LanguageOverviewTable({
  languageSummaries,
  sourceLanguage,
  onSelectLanguage,
  onTranslateLanguage,
}: LanguageOverviewTableProps) {
  return (
    <div className="relative overflow-x-auto rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Language</TableHead>
            <TableHead>Total Keys</TableHead>
            <TableHead>Translated</TableHead>
            <TableHead>Untranslated</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {languageSummaries.map((summary) => {
            const isSourceLanguage = summary.language === sourceLanguage;
            const languageData = getLanguageData(summary.language);
            const displayName = isSourceLanguage ? 'Base' : (languageData?.name || summary.language);
            
            return (
              <TableRow key={summary.language}>
                <TableCell className="font-medium flex items-center gap-2">
                  {languageData?.flag} {displayName}
                  {isSourceLanguage && <span className="text-xs text-muted-foreground">(Source)</span>}
                </TableCell>
                <TableCell>{summary.totalKeys}</TableCell>
                <TableCell>{summary.translatedKeys}</TableCell>
                <TableCell>{summary.untranslatedKeys}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={summary.progress} className="h-2 flex-grow" />
                    <span className="text-sm text-muted-foreground">{summary.progress.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!isSourceLanguage && (
                    <Button variant="ghost" size="sm" onClick={() => onTranslateLanguage(summary.language)} className="mr-2">
                      Translate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onSelectLanguage(summary.language)}>
                    View Details <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
