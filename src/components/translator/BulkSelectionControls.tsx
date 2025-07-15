import { CheckSquare, Square, MousePointer, Filter, Languages as LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ParsedString } from '@/types';

interface SelectedCell {
  key: string;
  lang: string;
}

interface BulkSelectionControlsProps {
  strings: ParsedString[];
  filteredStrings: ParsedString[];
  targetLanguages: string[];
  selectedCells: SelectedCell[];
  onBulkSelect: (cells: SelectedCell[]) => void;
  onClearSelection: () => void;
}

export function BulkSelectionControls({
  strings,
  filteredStrings,
  targetLanguages,
  selectedCells,
  onBulkSelect,
  onClearSelection,
}: BulkSelectionControlsProps) {
  const handleSelectAll = () => {
    const allCells: SelectedCell[] = [];
    filteredStrings.forEach(s => {
      targetLanguages.forEach(lang => {
        const translation = s.translations[lang];
        if (translation && (translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error')) {
          allCells.push({ key: s.key, lang });
        }
      });
    });
    onBulkSelect(allCells);
  };

  const handleSelectByStatus = (status: string) => {
    const statusCells: SelectedCell[] = [];
    filteredStrings.forEach(s => {
      targetLanguages.forEach(lang => {
        const translation = s.translations[lang];
        if (translation && translation.status === status) {
          statusCells.push({ key: s.key, lang });
        }
      });
    });
    onBulkSelect(statusCells);
  };

  const handleSelectByLanguage = (selectedLang: string) => {
    const langCells: SelectedCell[] = [];
    filteredStrings.forEach(s => {
      const translation = s.translations[selectedLang];
      if (translation && (translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error')) {
        langCells.push({ key: s.key, lang: selectedLang });
      }
    });
    onBulkSelect(langCells);
  };

  const handleSelectInverse = () => {
    const allSelectableCells: SelectedCell[] = [];
    filteredStrings.forEach(s => {
      targetLanguages.forEach(lang => {
        const translation = s.translations[lang];
        if (translation && (translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error')) {
          allSelectableCells.push({ key: s.key, lang });
        }
      });
    });

    const inverseCells = allSelectableCells.filter(cell => 
      !selectedCells.some(selected => selected.key === cell.key && selected.lang === cell.lang)
    );
    
    onBulkSelect(inverseCells);
  };

  const untranslatedCount = filteredStrings.reduce((count, s) => {
    return count + targetLanguages.filter(lang => {
      const translation = s.translations[lang];
      return translation && (translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error');
    }).length;
  }, 0);

  const translatedCount = filteredStrings.reduce((count, s) => {
    return count + targetLanguages.filter(lang => {
      const translation = s.translations[lang];
      return translation && translation.status === 'translated';
    }).length;
  }, 0);

  const errorCount = filteredStrings.reduce((count, s) => {
    return count + targetLanguages.filter(lang => {
      const translation = s.translations[lang];
      return translation && translation.status === 'error';
    }).length;
  }, 0);

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {selectedCells.length} selected
        </Badge>
        {selectedCells.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSelection}
            className="h-6 px-2 text-xs"
          >
            <Square className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <MousePointer className="h-3 w-3 mr-1" />
              Select
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleSelectAll}>
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>All untranslated ({untranslatedCount})</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSelectInverse}>
              <Square className="mr-2 h-4 w-4" />
              <span>Inverse selection</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSelectByStatus('new')}>
              <Filter className="mr-2 h-4 w-4" />
              <span>New only</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelectByStatus('error')}>
              <Filter className="mr-2 h-4 w-4" />
              <span>Errors only ({errorCount})</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {targetLanguages.map(lang => (
              <DropdownMenuItem key={lang} onClick={() => handleSelectByLanguage(lang)}>
                <LanguagesIcon className="mr-2 h-4 w-4" />
                <span>{lang} language</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Stats:</span>
        <Badge variant="secondary">{translatedCount} translated</Badge>
        <Badge variant="outline">{untranslatedCount} untranslated</Badge>
        {errorCount > 0 && <Badge variant="destructive">{errorCount} errors</Badge>}
      </div>
    </div>
  );
}