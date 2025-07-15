import { useEffect, useCallback } from 'react';

export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in an input, textarea, or contenteditable element
    const target = event.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return shortcuts;
}

export function formatShortcutKey(shortcut: ShortcutAction): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}

// Common shortcuts for translation apps
export const createTranslationShortcuts = (actions: {
  onTranslate?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onToggleSettings?: () => void;
}): ShortcutAction[] => {
  const shortcuts: ShortcutAction[] = [];

  if (actions.onTranslate) {
    shortcuts.push({
      key: 'Enter',
      ctrlKey: true,
      action: actions.onTranslate,
      description: 'Translate selected items'
    });
  }

  if (actions.onSelectAll) {
    shortcuts.push({
      key: 'a',
      ctrlKey: true,
      action: actions.onSelectAll,
      description: 'Select all untranslated items'
    });
  }

  if (actions.onClearSelection) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onClearSelection,
      description: 'Clear selection'
    });
  }

  if (actions.onExport) {
    shortcuts.push({
      key: 'e',
      ctrlKey: true,
      action: actions.onExport,
      description: 'Export file'
    });
  }

  if (actions.onImport) {
    shortcuts.push({
      key: 'o',
      ctrlKey: true,
      action: actions.onImport,
      description: 'Import file'
    });
  }

  if (actions.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrlKey: true,
      action: actions.onUndo,
      description: 'Undo'
    });
  }

  if (actions.onRedo) {
    shortcuts.push({
      key: 'y',
      ctrlKey: true,
      action: actions.onRedo,
      description: 'Redo'
    });
  }

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: actions.onSave,
      description: 'Save/Auto-save'
    });
  }

  if (actions.onToggleSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      action: actions.onToggleSettings,
      description: 'Toggle settings'
    });
  }

  return shortcuts;
};