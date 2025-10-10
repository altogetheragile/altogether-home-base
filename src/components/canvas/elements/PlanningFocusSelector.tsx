import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlanningFocuses } from '@/hooks/usePlanningFocuses';
import { Search, Plus, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanningFocusSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (focusId: string, focusData: any) => void;
}

export const PlanningFocusSelector: React.FC<PlanningFocusSelectorProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: focuses, isLoading } = usePlanningFocuses();

  const filteredFocuses = useMemo(() => {
    if (!focuses) return [];

    return focuses.filter(focus => {
      if (searchQuery && !focus.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [focuses, searchQuery]);

  const handleAdd = (focus: any) => {
    onAdd(focus.id, {
      name: focus.name,
      slug: focus.slug,
      description: focus.description,
      color: focus.color,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Planning Focus</DialogTitle>
          <DialogDescription>
            Select a planning focus to add to your canvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search planning focuses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Focuses List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredFocuses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No planning focuses found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFocuses.map(focus => (
                  <div
                    key={focus.id}
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="h-4 w-4" style={{ color: focus.color }} />
                          <h4 className="text-sm font-medium">{focus.name}</h4>
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: focus.color,
                              color: focus.color,
                            }}
                          >
                            {focus.display_order}
                          </Badge>
                        </div>
                        {focus.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {focus.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(focus)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
