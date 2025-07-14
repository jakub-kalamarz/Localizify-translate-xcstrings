'use client';

import { useState, useMemo, ChangeEvent, useRef, useEffect, useTransition } from 'react';
import { Cog, Upload, Languages, Loader2, FileJson, MoreHorizontal, Copy, XCircle, CheckCircle, Download, Search } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface SelectedCell {
  key: string;
  lang: string;
}

export default function TranslatorPage() {
  const [strings, setStrings] = useState<ParsedString[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isApiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [originalJson, setOriginalJson] = useState<any>(null);
  const [selectedCells, setSelectedCells] = useState<SelectedCell[]>([]);
  const [fileName, setFileName] = useState<string>('Localizable.xcstrings');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [textFilter, setTextFilter] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini_api_key');
    if (storedGeminiKey) {
      setGeminiApiKey(storedGeminiKey);
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);

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

  const handleSaveApiKeys = () => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
    toast({ title: 'API Key saved successfully.' });
    setApiKeyDialogOpen(false);
  };
  
  const updateOriginalJsonWithCurrentState = () => {
    if (!originalJson) return null;

    const newJson = JSON.parse(JSON.stringify(originalJson));
    newJson.sourceLanguage = sourceLanguage;
    const languages = new Set<string>([sourceLanguage]);

    strings.forEach(s => {
      if (!newJson.strings[s.key]) {
        newJson.strings[s.key] = {
          localizations: {},
        };
      }
      if(s.comment) {
        newJson.strings[s.key].comment = s.comment;
      }
      
      const localizations = newJson.strings[s.key].localizations || {};

      Object.entries(s.translations).forEach(([lang, translation]) => {
          languages.add(lang);
          const hasValue = translation.value && translation.value.trim() !== '';

          if (translation.status === 'translated' && hasValue) {
            localizations[lang] = { stringUnit: { state: 'translated', value: translation.value } };
          } else if(translation.status === 'non-translatable' && s.sourceValue) {
            localizations[lang] = { stringUnit: { state: 'translated', value: s.sourceValue } };
          } else if (hasValue) {
             // If it has a value but not explicitly translated, keep it as new
            localizations[lang] = { stringUnit: { state: 'new', value: translation.value }};
          } else {
            // Remove localization if value is empty
            delete localizations[lang];
          }
      });
      newJson.strings[s.key].localizations = localizations;
    });

    return newJson;
  }
  
  const handleExport = () => {
    const updatedJson = updateOriginalJsonWithCurrentState();
    if (!updatedJson) {
        toast({variant: 'destructive', title: "Nothing to export", description: "Load a file first."});
        return;
    };
    const blob = new Blob([JSON.stringify(updatedJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({title: "File exported successfully"});
  }
  
  const handleTranslationValueChange = (key: string, lang: string, value: string) => {
    setStrings(currentStrings => 
      currentStrings.map(s => {
        if (s.key === key) {
          const newTranslations = { ...s.translations };
          if (newTranslations[lang]) {
            newTranslations[lang].value = value;
            // If user edits, it's considered translated
            if (value.trim() !== '') {
              newTranslations[lang].status = 'translated';
            }
          }
          return { ...s, translations: newTranslations };
        }
        return s;
      })
    );
  };

  const handleTranslateSelected = () => {
    if (selectedCells.length === 0) {
      toast({ variant: 'destructive', title: 'No cells selected', description: 'Click on a cell to select it for translation.'});
      return;
    }

     if (!geminiApiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: `Please set your Gemini API key in Settings.`});
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
          translateStringsAction(aStrings, sourceLanguage, lang, selectedModel)
      );

      const allResults = await Promise.all(allPromises);

      const flatResults = allResults.flat();
      
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
          return changed ? { ...s, translations: newTranslations } : str;
      }));

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

  const StatusDisplay = ({ status, value }: { status: TranslationStatus, value: string }) => {
    if (status === 'translated' && value) {
        return <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />;
    }

    if (status === 'new' || status === 'untranslated' || status === 'non-translatable' || status === 'in-progress' || status === 'error') {
       const variant: "secondary" | "destructive" | "outline" = useMemo(() => {
          switch (status) {
              case 'new': return 'secondary';
              case 'untranslated': return 'secondary';
              case 'non-translatable': return 'outline';
              case 'in-progress': return 'outline';
              case 'error': return 'destructive';
              default: return 'secondary';
          }
      }, [status]);
      const text = status === 'untranslated' ? 'new' : status;
      return <Badge variant={variant} className="capitalize">{text}</Badge>;
    }
    
    return null;
  };
  
  const filteredStrings = useMemo(() => {
    return strings.filter(s => {
        const textMatch = textFilter === '' || 
                          s.key.toLowerCase().includes(textFilter.toLowerCase()) || 
                          s.sourceValue.toLowerCase().includes(textFilter.toLowerCase());

        if (!textMatch) return false;

        if (statusFilter === 'all') {
            return true;
        }

        if (statusFilter === 'untranslated') {
            return Object.values(s.translations).some(t => 
                t.status === 'new' || t.status === 'untranslated' || t.status === 'error'
            );
        }

        // Check if any translation for this key matches the status filter
        return Object.values(s.translations).some(t => t.status === statusFilter);
    });
  }, [strings, statusFilter, textFilter]);

  const targetLanguages = useMemo(() => allLanguages.filter(l => l !== sourceLanguage), [allLanguages, sourceLanguage]);

  return (
    <Card className="w-full max-w-[95vw] mx-auto shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-bold">Localizify</CardTitle>
                <CardDescription>Import, view, and translate .xcstrings files with AI. Click on cells to select them for translation.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xcstrings" className="hidden" />
                 <Button onClick={handleExport} variant="outline" disabled={strings.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export File
                </Button>
                 <Dialog open={isApiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline" size="icon"><Cog className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                          <DialogTitle>API Key Settings</DialogTitle>
                          <DialogDescription>
                              Your API keys are stored in your browser&apos;s local storage.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                             <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                             <Input id="geminiApiKey" type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} />
                          </div>
                      </div>
                      <DialogFooter>
                          <Button onClick={handleSaveApiKeys}>Save Key</Button>
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
            <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Filter by key or source..." 
                        value={textFilter}
                        onChange={(e) => setTextFilter(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="untranslated">Untranslated</SelectItem>
                        <SelectItem value="translated">Translated</SelectItem>
                        <SelectItem value="non-translatable">Non-Translatable</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                     <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleTranslateSelected} disabled={isPending || selectedCells.length === 0}>
                        {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Languages className="mr-2 h-4 w-4" />
                        )}
                        Translate {selectedCells.length > 0 ? `${selectedCells.length} ` : ''}Item(s)
                    </Button>
                </div>
            </div>
            <div className="relative overflow-x-auto rounded-md border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 w-[200px] border-r">Key</TableHead>
                  <TableHead className="w-[250px] border-r">Comment</TableHead>
                  <TableHead className="w-[300px] border-r">Source ({sourceLanguage})</TableHead>
                  {targetLanguages.map(lang => (
                    <TableHead key={lang} className="w-[300px] border-r">
                      {lang}
                    </TableHead>
                  ))}
                  <TableHead className="sticky right-0 bg-card z-10 w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStrings.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-mono text-xs sticky left-0 bg-card z-10 border-r">{s.key}</TableCell>
                    <TableCell className="text-xs text-muted-foreground border-r">{s.comment}</TableCell>
                    <TableCell className="border-r">{s.sourceValue}</TableCell>
                    {targetLanguages.map(lang => {
                        const translation = s.translations[lang];
                        const isSelected = selectedCells.some(c => c.key === s.key && c.lang === lang);
                        const canSelect = translation.status === 'new' || translation.status === 'untranslated' || translation.status === 'error';
                        return (
                          <TableCell 
                            key={lang} 
                            onClick={() => canSelect && handleCellClick(s.key, lang)}
                            className={`border-r align-top
                                ${canSelect ? 'cursor-pointer' : ''}
                                ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
                            `}
                          >
                            <div className="flex flex-col gap-2">
                                <Textarea
                                  value={translation?.value || ''}
                                  onChange={(e) => handleTranslationValueChange(s.key, lang, e.target.value)}
                                  className="min-h-[60px] text-sm flex-grow bg-transparent border-0 ring-0 focus-visible:ring-0 p-0"
                                  placeholder={canSelect ? 'Click to select for AI translation' : 'Edit translation'}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {translation?.value?.length || 0} chars
                                  </span>
                                  <StatusDisplay status={translation?.status || 'new'} value={translation?.value || ''}/>
                                </div>
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
