import { useState, useEffect } from 'react';
import { Database, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { translationCache } from '@/lib/translation-cache';
import { useToast } from '@/hooks/use-toast';

export function CacheManagementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    cacheSize: '0 Bytes',
    oldestEntry: null as Date | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStats(translationCache.getStats());
    }
  }, [isOpen]);

  const handleClearCache = () => {
    translationCache.clear();
    setStats({
      totalEntries: 0,
      cacheSize: '0 Bytes',
      oldestEntry: null,
    });
    toast({
      title: 'Cache cleared',
      description: 'All cached translations have been removed.',
    });
  };

  const refreshStats = () => {
    setStats(translationCache.getStats());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Cache
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Translation Cache</DialogTitle>
          <DialogDescription>
            Manage your translation memory cache to improve performance and reduce API costs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cache Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total entries:</span>
                <span className="font-medium">{stats.totalEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cache size:</span>
                <span className="font-medium">{stats.cacheSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Oldest entry:</span>
                <span className="font-medium">
                  {stats.oldestEntry ? stats.oldestEntry.toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                How Translation Cache Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The translation cache stores previously translated text to:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Reduce API calls and costs</li>
                <li>Improve translation speed</li>
                <li>Provide consistent translations</li>
              </ul>
              <p>
                Cache entries expire after 7 days and are automatically cleaned up.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshStats} className="flex-1">
              Refresh Stats
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Translation Cache</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear all cached translations? This action cannot be undone.
                    Future translations will need to be fetched from the API again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>
                    Clear Cache
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}