import { Search, Globe, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TranslationControlsProps {
  textFilter: string;
  onTextFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  selectedCellsCount: number;
  onTranslate: () => void;
  isPending: boolean;
  hasApiKey: boolean;
  hasActiveTranslations?: boolean;
}

export function TranslationControls({
  textFilter,
  onTextFilterChange,
  statusFilter,
  onStatusFilterChange,
  selectedCellsCount,
  onTranslate,
  isPending,
  hasApiKey,
  hasActiveTranslations = false,
}: TranslationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by key or source..." 
            value={textFilter}
            onChange={(e) => onTextFilterChange(e.target.value)}
            className="pl-10 w-72 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="untranslated">Untranslated</SelectItem>
            <SelectItem value="translated">Translated</SelectItem>
            <SelectItem value="non-translatable">Non-Translatable</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <Button 
          onClick={onTranslate} 
          disabled={isPending || selectedCellsCount === 0 || !hasApiKey}
          className="whitespace-nowrap rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 font-semibold"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : hasActiveTranslations ? (
            <Plus className="mr-2 h-4 w-4" />
          ) : (
            <Globe className="mr-2 h-4 w-4" />
          )}
          Translate {selectedCellsCount > 0 ? `${selectedCellsCount} ` : ''}Item(s)
        </Button>
      </div>
    </div>
  );
}