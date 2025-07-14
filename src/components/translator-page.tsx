'use client';

import { useState, useMemo, ChangeEvent, useRef, useEffect, useTransition } from 'react';
import { Cog, Upload, Languages, Loader2, FileJson, PlusCircle, Trash2 } from 'lucide-react';
import type { ParsedString, TranslationStatus } from '@/types';
import { parseXcstrings } from '@/lib/xcstrings-parser';
import { translateStringsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogClose
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface LanguageInfo {
  code: string;
  total: number;
  translated: number;
}

export default function TranslatorPage() {
  const [strings, setStrings] = useState<ParsedString[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('en');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [isAddLangDialogOpen, setAddLangDialogOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [originalJson, setOriginalJson] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const languageStats = useMemo((): LanguageInfo[] => {
    if (!originalJson) return [];

    const languages = new Set<string>([originalJson.sourceLanguage, ...Object.keys(Object.values(originalJson.strings)[0]?.localizations || {})]);
    
    return Array.from(allLanguages).map(lang => {
      if (lang === sourceLanguage) {
        return { code: lang, total: strings.length, translated: strings.length };
      }
      const { parsedData } = parseXcstrings(originalJson, lang);
      const translatedCount = parsedData.filter(s => s.status === 'translated').length;
      return { code: lang, total: strings.length, translated: translatedCount };
    });
  }, [originalJson, allLanguages, sourceLanguage, strings.length]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        setOriginalJson(jsonData);

        const { parsedData, languages, sourceLanguage } = parseXcstrings(jsonData, targetLanguage);
        
        setStrings(parsedData);
        setAllLanguages(languages);
        setSourceLanguage(sourceLanguage);
        setSelectedKeys(new Set());

        if (languages.length > 1 && !targetLanguage) {
            const defaultTarget = languages.find(l => l !== sourceLanguage) || '';
            setTargetLanguage(defaultTarget);
            const { parsedData: reparsedData } = parseXcstrings(jsonData, defaultTarget);
            setStrings(reparsedData);
        } else if (targetLanguage) {
            const { parsedData: reparsedData } = parseXcstrings(jsonData, targetLanguage);
            setStrings(reparsedData);
        }

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
  
  const handleTargetLanguageChange = (lang: string) => {
      setTargetLanguage(lang);
      if(originalJson){
         const { parsedData } = parseXcstrings(originalJson, lang);
         setStrings(parsedData);
         setSelectedKeys(new Set());
      }
  };

  const handleAddNewLanguage = () => {
    if (!newLanguage || allLanguages.includes(newLanguage)) {
        toast({variant: 'destructive', title: 'Invalid Language', description: 'Please enter a unique language code.'})
        return;
    }
    setAllLanguages(current => [...current, newLanguage]);
    setNewLanguage('');
    setAddLangDialogOpen(false);
    toast({title: 'Language Added', description: `You can now select "${newLanguage}" as a target language.`})
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const newKeys = new Set(strings.filter(s => s.status === 'new' || s.status === 'untranslated' || s.status === 'error').map(s => s.key));
      setSelectedKeys(newKeys);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    const newSelectedKeys = new Set(selectedKeys);
    if (checked) {
      newSelectedKeys.add(key);
    } else {
      newSelectedKeys.delete(key);
    }
    setSelectedKeys(newSelectedKeys);
  };

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini_api_key', newApiKey);
    toast({ title: 'API Key saved successfully.' });
    setApiKeyDialogOpen(false);
  };
  
  const handleTranslate = () => {
    if (selectedKeys.size === 0) {
      toast({ variant: 'destructive', title: 'No strings selected', description: 'Please select strings to translate.'});
      return;
    }
     if (!apiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: 'Please set your Gemini API key in Settings.'});
      return;
    }

    startTransition(async () => {
      const stringsToTranslate = strings.filter(s => selectedKeys.has(s.key));
      
      setStrings(current => current.map(s => selectedKeys.has(s.key) ? { ...s, status: 'in-progress' } : s));

      const results = await translateStringsAction(stringsToTranslate, sourceLanguage, targetLanguage);

      const resultsMap = new Map(results.map(r => [r.key, r]));

      setStrings(current => current.map(s => {
        if (resultsMap.has(s.key)) {
          const result = resultsMap.get(s.key)!;
          return {
            ...s,
            targetValue: result.translatedText,
            status: result.error ? 'error' : 'translated',
          };
        }
        return s;
      }));

      // Update original JSON with new translations
      if (originalJson) {
        const newJson = JSON.parse(JSON.stringify(originalJson));
        results.forEach(result => {
           if (!result.error && newJson.strings[result.key]) {
               if (!newJson.strings[result.key].localizations) {
                   newJson.strings[result.key].localizations = {};
               }
               newJson.strings[result.key].localizations[targetLanguage] = {
                   stringUnit: {
                       state: 'translated',
                       value: result.translatedText,
                   }
               };
           }
        });
        setOriginalJson(newJson);
      }


      const successfulTranslations = results.filter(r => !r.error).length;
      const failedTranslations = results.length - successfulTranslations;

      toast({
        title: 'Translation Complete',
        description: `${successfulTranslations} succeeded, ${failedTranslations} failed.`
      });
      setSelectedKeys(new Set());
    });
  };
  
  const stringsToTranslateCount = useMemo(() => {
    return strings.filter(s => s.status === 'new' || s.status === 'untranslated' || s.status === 'error').length;
  }, [strings]);

  const StatusBadge = ({ status }: { status: TranslationStatus }) => {
    const variant: "default" | "secondary" | "destructive" | "outline" = useMemo(() => {
        switch (status) {
            case 'translated': return 'default';
            case 'new': return 'secondary';
            case 'in-progress': return 'outline';
            case 'error': return 'destructive';
            default: return 'secondary';
        }
    }, [status]);
    const text = status === 'untranslated' ? 'new' : status;
    return <Badge variant={variant} className="capitalize w-[100px] justify-center">{text}</Badge>;
  };

  return (
    <Card className="w-full max-w-7xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline text-primary">XCStrings Translator</CardTitle>
            <CardDescription>Import, view, and translate .xcstrings files with AI.</CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        {strings.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <div className="flex justify-center mb-4">
              <FileJson className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start by importing a file</h3>
            <p className="text-muted-foreground mb-4">Click the button below to select your .xcstrings file.</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Import .xcstrings
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xcstrings" className="hidden" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Languages</h3>
                    <Dialog open={isAddLangDialogOpen} onOpenChange={setAddLangDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Add New</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Language</DialogTitle>
                          <DialogDescription>
                            Enter the language code (e.g., 'es' for Spanish, 'de' for German).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="new-lang-code">Language Code</Label>
                            <Input id="new-lang-code" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value.toLowerCase())} placeholder="e.g., fr" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAddNewLanguage}>Add Language</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Language</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languageStats.map((langInfo) => (
                                <TableRow key={langInfo.code} data-state={targetLanguage === langInfo.code ? 'selected' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{langInfo.code}</span>
                                            {langInfo.code === sourceLanguage && <Badge variant="secondary">Source</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={(langInfo.translated / langInfo.total) * 100} className="w-20 h-2" />
                                            <span className="text-xs text-muted-foreground">{langInfo.translated}/{langInfo.total}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            variant={targetLanguage === langInfo.code ? 'default' : 'ghost'}
                                            onClick={() => handleTargetLanguageChange(langInfo.code)}
                                            disabled={langInfo.code === sourceLanguage}
                                        >
                                            {targetLanguage === langInfo.code ? 'Selected' : 'Select'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import New File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xcstrings" className="hidden" />
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Strings for <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">{targetLanguage}</span></h3>
              <div className="relative overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          onCheckedChange={handleSelectAll}
                          checked={selectedKeys.size > 0 && selectedKeys.size === stringsToTranslateCount && stringsToTranslateCount > 0}
                          disabled={stringsToTranslateCount === 0}
                          aria-label="Select all rows for translation"
                        />
                      </TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Source ({sourceLanguage})</TableHead>
                      <TableHead>Target ({targetLanguage})</TableHead>
                      <TableHead className="text-center w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strings.length > 0 ? strings.map((s) => (
                      <TableRow key={s.key} data-state={selectedKeys.has(s.key) ? 'selected' : ''}>
                        <TableCell>
                          <Checkbox 
                              onCheckedChange={(checked) => handleSelectRow(s.key, !!checked)}
                              checked={selectedKeys.has(s.key)}
                              disabled={s.status !== 'new' && s.status !== 'untranslated' && s.status !== 'error'}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.key}</TableCell>
                        <TableCell>{s.sourceValue}</TableCell>
                        <TableCell className="text-muted-foreground">{s.targetValue}</TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={s.status} />
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            {targetLanguage ? `No strings found for ${targetLanguage}.` : 'Select a target language to begin.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {strings.length > 0 && (
        <CardFooter className="flex justify-end">
          <Button onClick={handleTranslate} disabled={isPending || selectedKeys.size === 0 || !targetLanguage || !apiKey}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            Translate {selectedKeys.size > 0 ? `${selectedKeys.size} ` : ''}Item(s)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
