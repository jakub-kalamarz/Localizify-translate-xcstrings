'use client';

import { useState, useMemo, ChangeEvent, useRef, useEffect, useTransition } from 'react';
import { Cog, Upload, Languages, Loader2, FileJson, AlertTriangle } from 'lucide-react';
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

export default function TranslatorPage() {
  const [strings, setStrings] = useState<ParsedString[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>('en');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [allLanguages, setAllLanguages] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        const { parsedData, languages, sourceLanguage } = parseXcstrings(jsonData, targetLanguage);
        setStrings(parsedData);
        setAllLanguages(languages);
        setSourceLanguage(sourceLanguage);
        setSelectedKeys(new Set());
        if (languages.length > 1 && !targetLanguage) {
            const defaultTarget = languages.find(l => l !== sourceLanguage) || '';
            setTargetLanguage(defaultTarget);
            // re-parse with the new target language
            const { parsedData: reparsedData } = parseXcstrings(jsonData, defaultTarget);
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
      // We need to re-parse the strings to reflect the new target language values
      // This assumes we kept the original file content or re-read it.
      // For simplicity here, we'll just update statuses based on current data.
      setStrings(currentStrings => 
        currentStrings.map(s => ({...s, targetValue: '', status: 'new'}))
      );
      toast({ title: `Target language set to ${lang}. Re-import your file to see existing translations for this language.`});
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const newKeys = new Set(strings.filter(s => s.status === 'new' || s.status === 'untranslated').map(s => s.key));
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
    return strings.filter(s => s.status === 'new' || s.status === 'untranslated').length;
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
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import New File
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xcstrings" className="hidden" />
              
                <div className="flex items-center gap-2">
                    <Label>From: </Label>
                    <Badge variant="secondary">{sourceLanguage}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor='target-lang'>To:</Label>
                  <Select onValueChange={handleTargetLanguageChange} value={targetLanguage} disabled={allLanguages.length === 0}>
                    <SelectTrigger className="w-[180px]" id="target-lang">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLanguages.filter(l => l !== sourceLanguage).map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <Separator className="my-4" />
            <div className="relative overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        onCheckedChange={handleSelectAll}
                        checked={selectedKeys.size > 0 && selectedKeys.size === stringsToTranslateCount}
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
                  {strings.map((s) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
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
