import { useState } from 'react';
import { Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { validateApiKey } from '@/lib/validation';
import { AVAILABLE_MODELS } from '@/lib/openai-translator';
import { QualitySettings } from '@/types';
import { QualitySettingsDialog } from './QualitySettingsDialog';

interface SettingsDialogProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  appContext: string;
  onAppContextChange: (context: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  qualitySettings?: QualitySettings;
  onQualitySettingsChange?: (settings: QualitySettings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ 
  apiKey, 
  onApiKeyChange, 
  appContext, 
  onAppContextChange, 
  selectedModel, 
  onModelChange,
  qualitySettings,
  onQualitySettingsChange,
  open,
  onOpenChange
}: SettingsDialogProps) {
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempAppContext, setTempAppContext] = useState(appContext);
  const [tempModel, setTempModel] = useState(selectedModel);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    // Skip validation for empty key (allows clearing)
    if (tempApiKey.trim() === '') {
      onApiKeyChange('');
      localStorage.removeItem('openai_api_key');
      toast({ title: 'API Key cleared successfully.' });
      setIsOpen(false);
      return;
    }

    // Validate API key format
    const validation = validateApiKey(tempApiKey);
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid API Key',
        description: validation.error,
      });
      return;
    }

    onApiKeyChange(tempApiKey);
    localStorage.setItem('openai_api_key', tempApiKey);
    
    onAppContextChange(tempAppContext.trim());
    localStorage.setItem('app_context', tempAppContext.trim());
    
    onModelChange(tempModel);
    localStorage.setItem('selected_model', tempModel);
    
    toast({ title: 'Settings saved successfully.' });
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }
    if (open) {
      setTempApiKey(apiKey);
      setTempAppContext(appContext);
      setTempModel(selectedModel);
    }
  };

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : isOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Cog className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Translation Settings</DialogTitle>
          <DialogDescription>
            Configure your API key, model, and app context to improve translation accuracy.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="openaiApiKey" className="text-sm font-semibold">OpenAI API Key</Label>
            <Input 
              id="openaiApiKey" 
              type="password" 
              value={tempApiKey} 
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="rounded-xl"
            />
            <p className="text-sm text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="model" className="text-sm font-semibold">Translation Model</Label>
            <Select value={tempModel} onValueChange={setTempModel}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the OpenAI model for translation. GPT-4o provides the best quality, while GPT-4o Mini and GPT-4.1 Mini are faster and more cost-effective.
            </p>
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <strong>Current:</strong> {AVAILABLE_MODELS.find(m => m.id === tempModel)?.name || tempModel}
            </div>
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="appContext" className="text-sm font-semibold">App Context (Optional)</Label>
            <Textarea 
              id="appContext"
              value={tempAppContext}
              onChange={(e) => setTempAppContext(e.target.value)}
              placeholder="e.g., This is a fitness tracking app for runners. Users can log workouts, track progress, and set goals. The app focuses on motivational language and clear instructions."
              rows={4}
              className="resize-none rounded-xl"
            />
            <p className="text-sm text-muted-foreground">
              Provide context about your app to help AI generate more accurate and contextually appropriate translations.
            </p>
          </div>
          
          {qualitySettings && onQualitySettingsChange && (
            <>
              <Separator />
              <div className="grid gap-3">
                <Label className="text-sm font-semibold">Copy Quality Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Configure quality analysis settings to improve your copy and translations.
                </p>
                <QualitySettingsDialog 
                  settings={qualitySettings} 
                  onSettingsChange={onQualitySettingsChange}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSave}
            className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 font-semibold"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}