
import React from 'react';
import { MoreHorizontal, Copy, XCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ParsedString, TranslationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SelectedCell {
  key: string;
  lang: string;
}

interface MemoizedTableRowProps {
  s: ParsedString;
  sourceLanguage: string;
  targetLanguages: string[];
  selectedCells: SelectedCell[];
  onCellClick: (key: string, lang: string) => void;
  onTranslationValueChange: (key: string, lang: string, value: string) => void;
  onCopySourceToAll: (key: string, markAsTranslated?: boolean) => void;
  onSetRowStatus: (key: string, status: TranslationStatus) => void;
}

const StatusDisplay = React.memo(({ status, value }: { status: TranslationStatus; value: string }) => {
  if (status === 'translated' && value) {
    return <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />;
  }

  if (status === 'new' || status === 'untranslated' || status === 'non-translatable' || status === 'in-progress' || status === 'error') {
    const variant: "secondary" | "destructive" | "outline" | "default" = (() => {
      switch (status) {
        case 'new': return 'secondary';
        case 'untranslated': return 'secondary';
        case 'non-translatable': return 'default';
        case 'in-progress': return 'outline';
        case 'error': return 'destructive';
        default: return 'secondary';
      }
    })();
    const text = status === 'untranslated' ? 'new' : status;
    return <Badge variant={variant} className="capitalize text-xs">{text}</Badge>;
  }
  
  return null;
});

export const MemoizedTableRow = React.memo(({
  s,
  sourceLanguage,
  targetLanguages,
  selectedCells,
  onCellClick,
  onTranslationValueChange,
  onCopySourceToAll,
  onSetRowStatus,
}: MemoizedTableRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs sticky left-0 bg-card z-10 border-r">
        {s.key}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground border-r">
        {s.comment}
      </TableCell>
      <TableCell className="border-r">{s.sourceValue}</TableCell>
      {targetLanguages.map(lang => {
        const translation = s.translations[lang];
        const isSelected = selectedCells.some(c => c.key === s.key && c.lang === lang);
        const canSelect = translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error';
        const isNonTranslatable = translation.status === 'non-translatable';
        
        return (
          <TableCell 
            key={lang} 
            onClick={() => canSelect && onCellClick(s.key, lang)}
            className={`border-r align-top transition-colors
              ${canSelect ? 'cursor-pointer hover:bg-secondary/50' : ''}
              ${isSelected ? 'bg-secondary' : ''}
              ${isNonTranslatable ? 'bg-muted/30' : ''}
            `}
          >
            <div className="flex flex-col gap-2">
              <Textarea
                value={translation?.value || ''}
                onChange={(e) => onTranslationValueChange(s.key, lang, e.target.value)}
                className={`min-h-[60px] text-sm flex-grow bg-transparent border-0 ring-0 focus-visible:ring-0 p-0 resize-none ${
                  isNonTranslatable ? 'text-muted-foreground italic' : ''
                }`}
                placeholder={canSelect ? 'Click to select for AI translation' : isNonTranslatable ? 'Marked as non-translatable' : 'Edit translation'}
                disabled={isNonTranslatable}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {translation?.value?.length || 0} chars
                </span>
                <StatusDisplay status={translation?.status || 'new'} value={translation?.value || ''} />
              </div>
            </div>
          </TableCell>
        );
      })}
      <TableCell className="sticky right-0 bg-card z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCopySourceToAll(s.key, true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Mark as Translated</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetRowStatus(s.key, 'non-translatable')}>
              <XCircle className="mr-2 h-4 w-4" />
              <span>Mark as Non-Translatable</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetRowStatus(s.key, 'new')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Reset to New</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopySourceToAll(s.key, false)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Source to All</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
