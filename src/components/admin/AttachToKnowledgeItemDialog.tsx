import React, { useState, useEffect } from 'react';
import { Link2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKnowledgeItems } from '@/hooks/useKnowledgeItems';
import { useKnowledgeItemMediaMutations } from '@/hooks/useMediaAssets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AttachToKnowledgeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMediaIds: string[];
  preselectedKnowledgeItemId?: string | null;
}

export const AttachToKnowledgeItemDialog: React.FC<AttachToKnowledgeItemDialogProps> = ({
  open,
  onOpenChange,
  selectedMediaIds,
  preselectedKnowledgeItemId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKnowledgeItemId, setSelectedKnowledgeItemId] = useState<string | null>(null);

  // Set preselected knowledge item when dialog opens
  useEffect(() => {
    if (open && preselectedKnowledgeItemId) {
      setSelectedKnowledgeItemId(preselectedKnowledgeItemId);
    }
  }, [open, preselectedKnowledgeItemId]);

  const { data: knowledgeItems = [] } = useKnowledgeItems({
    search: searchQuery || undefined,
    showUnpublished: true,
  });

  const { updateKnowledgeItemMedia } = useKnowledgeItemMediaMutations();

  const handleAttach = async () => {
    if (!selectedKnowledgeItemId || selectedMediaIds.length === 0) return;

    try {
      await updateKnowledgeItemMedia.mutateAsync({
        knowledgeItemId: selectedKnowledgeItemId,
        mediaAssetIds: selectedMediaIds,
      });
      onOpenChange(false);
      setSelectedKnowledgeItemId(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to attach media:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Attach to Knowledge Item
          </DialogTitle>
          <DialogDescription>
            Select a Knowledge Item to attach {selectedMediaIds.length} media asset(s) to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="space-y-2 p-4">
              {knowledgeItems.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No knowledge items found
                </div>
              )}
              {knowledgeItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedKnowledgeItemId(item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedKnowledgeItemId === item.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {item.knowledge_categories && (
                          <Badge variant="outline" className="text-xs">
                            {item.knowledge_categories.name}
                          </Badge>
                        )}
                        {item.is_published ? (
                          <Badge variant="default" className="text-xs">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAttach}
            disabled={!selectedKnowledgeItemId || updateKnowledgeItemMedia.isPending}
          >
            {updateKnowledgeItemMedia.isPending ? 'Attaching...' : 'Attach Media'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
