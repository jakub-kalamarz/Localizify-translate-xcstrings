import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

export interface TranslationProgressItem {
  language: string;
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

interface TranslationProgressDialogProps {
  isOpen: boolean;
  progress: TranslationProgressItem[];
  onClose?: () => void;
}

export function TranslationProgressDialog({ 
  isOpen, 
  progress, 
  onClose 
}: TranslationProgressDialogProps) {
  const totalItems = progress.reduce((sum, item) => sum + item.total, 0);
  const completedItems = progress.reduce((sum, item) => sum + item.completed, 0);
  const failedItems = progress.reduce((sum, item) => sum + item.failed, 0);
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  const isCompleted = completedItems + failedItems === totalItems && totalItems > 0;

  const getStatusIcon = (status: TranslationProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TranslationProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in-progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isCompleted && <Loader2 className="h-5 w-5 animate-spin" />}
            Translation Progress
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? `Translation completed: ${completedItems} successful, ${failedItems} failed`
              : `Translating ${totalItems} items across ${progress.length} languages`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {completedItems + failedItems} / {totalItems}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Language Progress */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Languages</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {progress.map((item) => (
                <div
                  key={item.language}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.language}</span>
                    <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.completed}
                      {item.failed > 0 && (
                        <span className="text-red-500"> (+{item.failed} failed)</span>
                      )}
                      /{item.total}
                    </span>
                    <div className="w-20">
                      <Progress 
                        value={item.total > 0 ? ((item.completed + item.failed) / item.total) * 100 : 0} 
                        className="h-1" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}