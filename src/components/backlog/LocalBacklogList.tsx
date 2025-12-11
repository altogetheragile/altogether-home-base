import React, { useState, useCallback } from 'react';
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { UnifiedStoryEditDialog } from '@/components/stories/UnifiedStoryEditDialog';
import { UnifiedStoryData } from '@/types/story';

interface LocalBacklogListProps {
  items: LocalBacklogItem[];
  onUpdateItem: (id: string, updates: Partial<LocalBacklogItem>) => void;
  onDeleteItem: (id: string) => void;
  onReorderItems: (updates: { id: string; backlog_position: number }[]) => void;
  isEditable?: boolean;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'idea', label: 'Ideas' },
  { value: 'refined', label: 'Refined' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_FILTERS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const LocalBacklogList: React.FC<LocalBacklogListProps> = ({ 
  items, 
  onUpdateItem, 
  onDeleteItem, 
  onReorderItems,
  isEditable = true 
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Dialog state
  const [editingItem, setEditingItem] = useState<LocalBacklogItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isEditable || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedItems = [...filteredItems];
    const [removed] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(targetIndex, 0, removed);

    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));

    onReorderItems(updates);
    setDraggedIndex(null);
  }, [draggedIndex, filteredItems, onReorderItems, isEditable]);

  const handleMoveUp = (index: number) => {
    if (!isEditable || index === 0) return;
    const reorderedItems = [...filteredItems];
    [reorderedItems[index - 1], reorderedItems[index]] = [reorderedItems[index], reorderedItems[index - 1]];
    
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));
    onReorderItems(updates);
  };

  const handleMoveDown = (index: number) => {
    if (!isEditable || index === filteredItems.length - 1) return;
    const reorderedItems = [...filteredItems];
    [reorderedItems[index], reorderedItems[index + 1]] = [reorderedItems[index + 1], reorderedItems[index]];
    
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));
    onReorderItems(updates);
  };

  const handleEdit = (item: LocalBacklogItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSave = (data: UnifiedStoryData) => {
    if (editingItem) {
      onUpdateItem(editingItem.id, {
        title: data.title,
        description: data.description,
        acceptance_criteria: data.acceptance_criteria,
        priority: data.priority || 'medium',
        status: data.status || 'idea',
        source: data.source,
        estimated_value: data.estimated_value,
        estimated_effort: data.story_points || data.estimated_effort,
        target_release: data.target_release,
        tags: data.tags,
        user_story_id: data.user_story_id,
      });
    }
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  // Convert LocalBacklogItem to UnifiedStoryData for the dialog
  const getDialogData = (item: LocalBacklogItem | null): Partial<UnifiedStoryData> | undefined => {
    if (!item) return undefined;
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      acceptance_criteria: item.acceptance_criteria,
      priority: item.priority as any,
      status: item.status,
      source: item.source,
      estimated_value: item.estimated_value,
      story_points: item.estimated_effort, // Map effort to story points
      estimated_effort: item.estimated_effort,
      target_release: item.target_release,
      tags: item.tags,
      user_story_id: item.user_story_id,
    };
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_FILTERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Badge variant="secondary" className="text-sm">
          {filteredItems.length} items
        </Badge>
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {items.length === 0 
            ? "No backlog items yet. Add your first item above!"
            : "No items match your filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              draggable={isEditable}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => setDraggedIndex(null)}
              className={draggedIndex === index ? 'opacity-50' : ''}
            >
              <LocalBacklogItemCard
                item={item}
                index={index}
                onUpdate={(updates) => onUpdateItem(item.id, updates)}
                onDelete={() => onDeleteItem(item.id)}
                onEdit={() => handleEdit(item)}
                onMoveUp={isEditable && index > 0 ? () => handleMoveUp(index) : undefined}
                onMoveDown={isEditable && index < filteredItems.length - 1 ? () => handleMoveDown(index) : undefined}
                isDragging={draggedIndex === index}
                isEditable={isEditable}
              />
            </div>
          ))}
        </div>
      )}

      {/* Unified Edit Dialog */}
      <UnifiedStoryEditDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        data={getDialogData(editingItem)}
        onSave={handleSave}
        mode="backlog"
      />
    </div>
  );
};
