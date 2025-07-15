import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { validateLanguageCode, sanitizeLanguageCode } from '@/lib/validation';

interface AddLanguageDialogProps {
  allLanguages: string[];
  onAddLanguage: (code: string) => void;
  disabled?: boolean;
}

export function AddLanguageDialog({ allLanguages, onAddLanguage, disabled = false }: AddLanguageDialogProps) {
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAdd = () => {
    const input = newLanguageCode.trim();
    
    if (!input) {
      toast({ 
        variant: 'destructive', 
        title: 'Language code cannot be empty.' 
      });
      return;
    }

    // Split by comma and process each code
    const codes = input.split(',').map(code => sanitizeLanguageCode(code)).filter(code => code);
    
    if (codes.length === 0) {
      toast({ 
        variant: 'destructive', 
        title: 'No valid language codes found.' 
      });
      return;
    }

    const errors = [];
    const successes = [];

    for (const code of codes) {
      // Validate language code format
      const validation = validateLanguageCode(code);
      if (!validation.isValid) {
        errors.push(`${code}: ${validation.error}`);
        continue;
      }

      // Check if language already exists
      if (allLanguages.includes(code)) {
        errors.push(`${code}: Language already exists`);
        continue;
      }

      onAddLanguage(code);
      successes.push(code);
    }

    // Show results
    if (successes.length > 0) {
      toast({ 
        title: `Added ${successes.length} language(s): ${successes.join(', ')}` 
      });
    }
    
    if (errors.length > 0) {
      toast({ 
        variant: 'destructive', 
        title: 'Some languages failed to add:',
        description: errors.join('; ')
      });
    }

    setNewLanguageCode('');
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setNewLanguageCode('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Language
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Language</DialogTitle>
          <DialogDescription>
            Enter a single language code (e.g., "en", "fr", "zh-Hans") or multiple codes separated by commas.
            Supported: en, pl, de, es, fr, it, pt, ru, tr, zh-Hans, zh-Hant, ja, ko, ar, hi, vi, id, th, nl, sv, fi, no, da, cs, hu, ro, sk, bg, el, hr, lt, lv, sl, et
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lang-code">Language Code</Label>
            <Input 
              id="lang-code" 
              value={newLanguageCode} 
              onChange={(e) => setNewLanguageCode(e.target.value)} 
              placeholder="e.g. en or en,fr,de"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Add Language</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}