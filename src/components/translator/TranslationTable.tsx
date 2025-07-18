import { memo } from 'react';
import { ParsedString, TranslationStatus } from '@/types';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MemoizedTableRow } from './MemoizedTableRow';

interface TranslationTableProps {
  sourceLanguage: string;
  targetLanguages: string[];
  selectedCells: { key: string; lang: string }[];
  onCellClick: (key: string, lang: string) => void;
  onTranslationValueChange: (key: string, lang: string, value: string) => void;
  onCopySourceToAll: (key: string, markAsTranslated?: boolean) => void;
  onSetRowStatus: (key: string, status: TranslationStatus) => void;
  filteredStrings: ParsedString[];
  selectedLanguage: string | null;
}

export const TranslationTable = memo(function TranslationTable({
  sourceLanguage,
  targetLanguages,
  selectedCells,
  onCellClick,
  onTranslationValueChange,
  onCopySourceToAll,
  onSetRowStatus,
  filteredStrings,
  selectedLanguage,
}: TranslationTableProps) {
  return (
    <div className="relative overflow-x-auto rounded-md border">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10 w-[200px] border-r">Key</TableHead>
            <TableHead className="w-[250px] border-r">Comment</TableHead>
            <TableHead className="w-[300px] border-r">Source ({sourceLanguage})</TableHead>
            {selectedLanguage ? (
              selectedLanguage !== sourceLanguage && (
                <TableHead key={selectedLanguage} className="w-[300px] border-r">
                  {selectedLanguage}
                </TableHead>
              )
            ) : (
              targetLanguages.map(lang => (
                <TableHead key={lang} className="w-[300px] border-r">
                  {lang}
                </TableHead>
              ))
            )}
            <TableHead className="sticky right-0 bg-card z-10 w-[80px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStrings.map((s) => (
            <MemoizedTableRow
              key={s.key}
              s={s}
              sourceLanguage={sourceLanguage}
              targetLanguages={selectedLanguage ? (selectedLanguage !== sourceLanguage ? [selectedLanguage] : []) : targetLanguages}
              selectedCells={selectedCells}
              onCellClick={onCellClick}
              onTranslationValueChange={onTranslationValueChange}
              onCopySourceToAll={onCopySourceToAll}
              onSetRowStatus={onSetRowStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});