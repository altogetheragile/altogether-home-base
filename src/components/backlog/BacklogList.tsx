import React, { useState, useCallback } from 'react';
import { BacklogItem, useReorderBacklogItems } from '@/hooks/useBacklogItems';
import { BacklogItemCard } from './BacklogItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';

interface BacklogListProps {
  items: BacklogItem[];
  isLoading?: boolean;
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

export const BacklogList: React.FC<BacklogListProps> = ({ items, isLoading }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const reorderItems = useReorderBacklogItems();

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
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedItems = [...filteredItems];
    const [removed] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(targetIndex, 0, removed);

    // Update positions
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));

    reorderItems.mutate(updates);
    setDraggedIndex(null);
  }, [draggedIndex, filteredItems, reorderItems]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reorderedItems = [...filteredItems];
    [reorderedItems[index - 1], reorderedItems[index]] = [reorderedItems[index], reorderedItems[index - 1]];
    
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));
    reorderItems.mutate(updates);
  };

  const handleMoveDown = (index: number) => {
    if (index === filteredItems.length - 1) return;
    const reorderedItems = [...filteredItems];
    [reorderedItems[index], reorderedItems[index + 1]] = [reorderedItems[index + 1], reorderedItems[index]];
    
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      backlog_position: idx,
    }));
    reorderItems.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

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
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => setDraggedIndex(null)}
              className={draggedIndex === index ? 'opacity-50' : ''}
            >
              <BacklogItemCard
                item={item}
                index={index}
                onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                onMoveDown={index < filteredItems.length - 1 ? () => handleMoveDown(index) : undefined}
                isDragging={draggedIndex === index}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
