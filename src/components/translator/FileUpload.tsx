import { Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parseXcstrings } from '@/lib/xcstrings-parser';
import { ParsedString } from '@/types';
import { validateFile, validateXCStringsContent } from '@/lib/validation';

interface FileUploadProps {
  onFileLoad: (data: {
    strings: ParsedString[];
    languages: string[];
    sourceLanguage: string;
    originalJson: any;
    fileName: string;
  }) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileLoad, disabled = false }: FileUploadProps) {
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid file',
        description: fileValidation.error,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Validate content structure
        const contentValidation = validateXCStringsContent(content);
        if (!contentValidation.isValid) {
          toast({
            variant: 'destructive',
            title: 'Invalid file content',
            description: contentValidation.error,
          });
          return;
        }

        const jsonData = contentValidation.data;
        const { parsedData, languages, sourceLanguage } = parseXcstrings(jsonData);
        
        // Additional validation
        if (parsedData.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Empty file',
            description: 'The file contains no translatable strings.',
          });
          return;
        }

        onFileLoad({
          strings: parsedData,
          languages,
          sourceLanguage,
          originalJson: jsonData,
          fileName: file.name,
        });

        toast({ 
          title: 'File loaded successfully', 
          description: `${parsedData.length} strings found across ${languages.length} languages.` 
        });
      } catch (error) {
        console.error('Failed to parse file:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading file',
          description: error instanceof Error ? error.message : 'The selected file is not a valid .xcstrings file.',
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File read error',
        description: 'Unable to read the selected file. Please try again.',
      });
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="relative">
      <Button 
        onClick={() => document.getElementById('file-input')?.click()} 
        variant="outline"
        disabled={disabled}
        className="rounded-xl"
      >
        <Upload className="mr-2 h-4 w-4" /> Import File
      </Button>
      <input
        id="file-input"
        type="file"
        onChange={handleFileChange}
        accept=".xcstrings"
        className="hidden"
      />
    </div>
  );
}

export function EmptyState({ onImportClick }: { onImportClick: () => void }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center">
          <FileJson className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">Start by importing a file</h3>
      <p className="text-muted-foreground mb-8 text-lg">
        Click the button below to select your .xcstrings file and begin translating.
      </p>
      <Button 
        onClick={onImportClick} 
        className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 font-semibold text-lg"
      >
        <Upload className="mr-2 h-5 w-5" /> Import File
      </Button>
    </div>
  );
}