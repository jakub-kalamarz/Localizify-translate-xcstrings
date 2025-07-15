import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ShortcutAction, formatShortcutKey } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  shortcuts: ShortcutAction[];
}

export function KeyboardShortcutsDialog({ shortcuts }: KeyboardShortcutsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Keyboard className="h-4 w-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to work more efficiently.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="inline-flex items-center rounded border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {formatShortcutKey(shortcut)}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Shortcuts are disabled when typing in input fields or text areas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}