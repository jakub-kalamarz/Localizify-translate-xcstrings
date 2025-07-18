import { useState, useEffect } from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { QualitySettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QualitySettingsDialogProps {
  settings: QualitySettings;
  onSettingsChange: (settings: QualitySettings) => void;
}

export function QualitySettingsDialog({ 
  settings, 
  onSettingsChange 
}: QualitySettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<QualitySettings>(settings);
  const [terminologyText, setTerminologyText] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
    // Convert terminology object to text format
    const terminologyEntries = Object.entries(settings.terminology)
      .map(([incorrect, correct]) => `${incorrect} → ${correct}`)
      .join('\n');
    setTerminologyText(terminologyEntries);
  }, [settings]);

  const handleSave = () => {
    // Parse terminology text back to object
    const terminologyLines = terminologyText.split('\n').filter(line => line.trim());
    const terminology: Record<string, string> = {};
    
    terminologyLines.forEach(line => {
      const [incorrect, correct] = line.split('→').map(s => s.trim());
      if (incorrect && correct) {
        terminology[incorrect] = correct;
      }
    });

    const updatedSettings = {
      ...localSettings,
      terminology,
    };

    onSettingsChange(updatedSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultSettings: QualitySettings = {
      enabled: true,
      autoAnalyze: true,
      strictMode: false,
      minScore: 70,
      enabledChecks: {
        clarity: true,
        consistency: true,
        formatting: true,
        context: true,
        length: true,
        placeholders: true,
      },
      terminology: {},
    };
    
    setLocalSettings(defaultSettings);
    setTerminologyText('');
  };

  const checkDescriptions = {
    clarity: 'Analyze text for readability, passive voice, and complex language',
    consistency: 'Check for consistent terminology and style across all text',
    formatting: 'Validate punctuation, capitalization, and spacing',
    context: 'Ensure text provides adequate context for understanding',
    length: 'Check for appropriate text length for UI elements',
    placeholders: 'Verify placeholder formatting and preservation',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Quality Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copy Quality Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">General</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Quality Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Turn on/off all quality analysis features
                </p>
              </div>
              <Switch
                checked={localSettings.enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Analyze</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically analyze text as you type
                </p>
              </div>
              <Switch
                checked={localSettings.autoAnalyze}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, autoAnalyze: checked }))
                }
                disabled={!localSettings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Strict Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Apply stricter quality standards
                </p>
              </div>
              <Switch
                checked={localSettings.strictMode}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, strictMode: checked }))
                }
                disabled={!localSettings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Quality Threshold */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Threshold</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Quality Score</Label>
                <Badge variant="outline">{localSettings.minScore}%</Badge>
              </div>
              <Slider
                value={[localSettings.minScore]}
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, minScore: value[0] }))
                }
                max={100}
                min={0}
                step={5}
                className="w-full"
                disabled={!localSettings.enabled}
              />
              <p className="text-sm text-muted-foreground">
                Text below this score will be flagged for review
              </p>
            </div>
          </div>

          <Separator />

          {/* Quality Checks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quality Checks</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(checkDescriptions).map(([checkType, description]) => (
                <div key={checkType} className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="capitalize">{checkType}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.enabledChecks[checkType as keyof typeof localSettings.enabledChecks]}
                    onCheckedChange={(checked) => 
                      setLocalSettings(prev => ({
                        ...prev,
                        enabledChecks: {
                          ...prev.enabledChecks,
                          [checkType]: checked,
                        }
                      }))
                    }
                    disabled={!localSettings.enabled}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Terminology */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Custom Terminology</h3>
            
            <div className="space-y-2">
              <Label>Preferred Terms</Label>
              <p className="text-sm text-muted-foreground">
                Define preferred terminology for consistency. Format: &quot;incorrect term → correct term&quot; (one per line)
              </p>
              <Textarea
                value={terminologyText}
                onChange={(e) => setTerminologyText(e.target.value)}
                placeholder="login → log in&#10;setup → set up&#10;ok → OK"
                className="min-h-[100px] font-mono text-sm"
                disabled={!localSettings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}