'use client';

import { useState, useMemo, ChangeEvent, useRef, useEffect, useTransition } from 'react';
import { Cog, Upload, Languages, Loader2, FileJson, MoreHorizontal, Copy, XCircle, CheckCircle } from 'lucide-react';
import type { ParsedString, TranslationStatus, LanguageTranslation } from '@/types';
import { parseXcstrings } from '@/lib/xcstrings-parser';
import { translateStringsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SelectedCell {
  key: string;
  lang: string;
}

export default function TranslatorPage() {
  const [strings, setStrings] = useState<ParsedString[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [originalJson, setOriginalJson] = useState<any>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        setOriginalJson(jsonData);

        const { parsedData, languages, sourceLanguage } = parseXcstrings(jsonData);
        
        setStrings(parsedData);
        setAllLanguages(languages);
        setSourceLanguage(sourceLanguage);
        setSelectedCells([]);

        toast({ title: 'File loaded successfully', description: `${parsedData.length} strings found.` });
      } catch (error) {
        console.error('Failed to parse file:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading file',
          description: 'The selected file is not a valid JSON .xcstrings file.',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleCellClick = (key: string, lang: string) => {
      const cell: SelectedCell = { key, lang };
      const isSelected = selectedCells.some(c => c.key === key && c.lang === lang);

      if (isSelected) {
          setSelectedCells(prev => prev.filter(c => !(c.key === key && c.lang === lang)));
      } else {
          setSelectedCells(prev => [...prev, cell]);
      }
  }

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini_api_key', newApiKey);
    toast({ title: 'API Key saved successfully.' });
    setApiKeyDialogOpen(false);
  };
  
  const handleTranslateSelected = () => {
    if (selectedCells.length === 0) {
      toast({ variant: 'destructive', title: 'No cells selected', description: 'Click on a cell to select it for translation.'});
      return;
    }
     if (!apiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: 'Please set your Gemini API key in Settings.'});
      return;
    }

    startTransition(async () => {
      // Mark selected cells as in-progress
      setStrings(current => current.map(s => {
          const newTranslations = { ...s.translations };
          let changed = false;
          selectedCells.forEach(cell => {
              if (cell.key === s.key && newTranslations[cell.lang]) {
                  newTranslations[cell.lang].status = 'in-progress';
                  changed = true;
              }
          });
          return changed ? { ...s, translations: newTranslations } : s;
      }));
      
      const translationsByLang = selectedCells.reduce((acc, cell) => {
        if (!acc[cell.lang]) {
          acc[cell.lang] = [];
        }
        const stringToTranslate = strings.find(s => s.key === cell.key);
        if (stringToTranslate) {
          acc[cell.lang].push({ key: cell.key, text: stringToTranslate.sourceValue });
        }
        return acc;
      }, {} as Record<string, {key: string; text: string}[]>);

      const allPromises = Object.entries(translationsByLang).map(([lang, aStrings]) => 
          translateStringsAction(aStrings, sourceLanguage, lang)
      );

      const allResults = await Promise.all(allPromises);

      const flatResults = allResults.flat();
      const resultsMap = new Map(flatResults.map(r => [`${r.key}-${r.translatedText}`, r]));

      setStrings(current => current.map(str => {
          const newTranslations = { ...str.translations };
          let changed = false;
          Object.keys(newTranslations).forEach(lang => {
              const result = flatResults.find(r => r.key === str.key && selectedCells.some(sc => sc.key === str.key && sc.lang === lang));
              if (result) {
                  newTranslations[lang] = {
                      value: result.error ? str.translations[lang].value : result.translatedText,
                      status: result.error ? 'error' : 'translated'
                  };
                  changed = true;
              }
          })
          return changed ? { ...str, translations: newTranslations } : str;
      }));

      // Update original JSON
       if (originalJson) {
         const newJson = JSON.parse(JSON.stringify(originalJson));
         flatResults.forEach(result => {
           const lang = Object.keys(translationsByLang).find(l => translationsByLang[l].some(s => s.key === result.key));
           if (lang && !result.error && newJson.strings[result.key]) {
             if (!newJson.strings[result.key].localizations) {
               newJson.strings[result.key].localizations = {};
             }
             newJson.strings[result.key].localizations[lang] = {
               stringUnit: {
                 state: 'translated',
                 value: result.translatedText,
               }
             };
           }
         });
         setOriginalJson(newJson);
       }

      toast({ title: 'Translation Complete' });
      setSelectedCells([]);
    });
  };

  const setRowStatus = (key: string, status: TranslationStatus) => {
    setStrings(current => current.map(s => {
      if (s.key === key) {
        const newTranslations = { ...s.translations };
        Object.keys(newTranslations).forEach(lang => {
          newTranslations[lang].status = status;
          if(status === 'non-translatable') {
            newTranslations[lang].value = s.sourceValue;
          }
        });
        return { ...s, translations: newTranslations };
      }
      return s;
    }));
  };
  
  const copySourceToAll = (key: string, markAsTranslated: boolean = false) => {
    setStrings(current => current.map(s => {
        if (s.key === key) {
            const newTranslations = { ...s.translations };
            Object.keys(newTranslations).forEach(lang => {
                newTranslations[lang].value = s.sourceValue;
                if (markAsTranslated) {
                    newTranslations[lang].status = 'translated';
                }
            });
            return { ...s, translations: newTranslations };
        }
        return s;
    }))
  };

  const StatusBadge = ({ status }: { status: TranslationStatus }) => {
    const variant: "default" | "secondary" | "destructive" | "outline" = useMemo(() => {
        switch (status) {
            case 'translated': return 'default';
            case 'new': return 'secondary';
            case 'untranslated': return 'secondary';
            case 'non-translatable': return 'outline';
            case 'in-progress': return 'outline';
            case 'error': return 'destructive';
            default: return 'secondary';
        }
    }, [status]);
    const text = status === 'untranslated' ? 'new' : status;
    return <Badge variant={variant} className="capitalize w-full justify-center">{text}</Badge>;
  };

  const targetLanguages = useMemo(() => allLanguages.filter(l => l !== sourceLanguage), [allLanguages, sourceLanguage]);

  return (
    <Card className="w-full max-w-[95vw] mx-auto shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-bold">XCStrings Translator</CardTitle>
                <CardDescription>Import, view, and translate .xcstrings files with AI. Click on cells to select them for translation.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xcstrings" className="hidden" />
                 <Dialog open={isApiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline" size="icon"><Cog className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>API Key Settings</DialogTitle>
                        <DialogDescription>
                        Enter your Gemini API key. This is stored securely in your browser&apos;s local storage and never sent to our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="apiKey">Gemini API Key</Label>
                        <Input id="apiKey" type="password" defaultValue={apiKey} onChange={e => setApiKey(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => handleSaveApiKey(apiKey)}>Save Key</Button>
                    </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {strings.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <div className="flex justify-center mb-4">
              <FileJson className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start by importing a file</h3>
            <p className="text-muted-foreground mb-4">Click the button above to select your .xcstrings file.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleTranslateSelected} disabled={isPending || selectedCells.length === 0 || !apiKey}>
                    {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Languages className="mr-2 h-4 w-4" />
                    )}
                    Translate {selectedCells.length > 0 ? `${selectedCells.length} ` : ''}Item(s)
                </Button>
            </div>
            <div className="relative overflow-x-auto rounded-md border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 w-[200px]">Key</TableHead>
                  <TableHead className="w-[250px]">Comment</TableHead>
                  <TableHead className="w-[300px]">Source ({sourceLanguage})</TableHead>
                  {targetLanguages.map(lang => (
                    <TableHead key={lang} className="w-[300px]">
                      {lang}
                    </TableHead>
                  ))}
                  <TableHead className="sticky right-0 bg-card z-10 w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strings.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-mono text-xs sticky left-0 bg-card z-10">{s.key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.comment}</TableCell>
                    <TableCell>{s.sourceValue}</TableCell>
                    {targetLanguages.map(lang => {
                        const translation = s.translations[lang];
                        const isSelected = selectedCells.some(c => c.key === s.key && c.lang === lang);
                        const canSelect = translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error';
                        return (
                          <TableCell 
                            key={lang} 
                            onClick={() => canSelect && handleCellClick(s.key, lang)}
                            className={`
                                ${canSelect ? 'cursor-pointer' : ''}
                                ${isSelected ? 'bg-accent/50' : ''}
                            `}
                          >
                            <div className="flex flex-col gap-2">
                                <span className="text-muted-foreground">{translation?.value || ''}</span>
                                <StatusBadge status={translation?.status || 'new'}/>
                            </div>
                          </TableCell>
                        )
                    })}
                    <TableCell className="sticky right-0 bg-card z-10">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4"/>
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copySourceToAll(s.key, true)}>
                                    <CheckCircle className="mr-2 h-4 w-4"/>
                                    <span>Mark as Translated</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRowStatus(s.key, 'non-translatable')}>
                                    <XCircle className="mr-2 h-4 w-4"/>
                                    <span>Mark as Non-Translatable</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copySourceToAll(s.key, false)}>
                                    <Copy className="mr-2 h-4 w-4"/>
                                    <span>Copy Source to All</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
