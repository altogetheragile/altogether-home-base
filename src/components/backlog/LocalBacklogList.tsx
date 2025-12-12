import React, { useState, useCallback, useMemo } from 'react';
import { LocalBacklogItem, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Layers, List } from 'lucide-react';
import { UnifiedStoryEditDialog } from '@/components/stories/UnifiedStoryEditDialog';
import { UnifiedStoryData, ItemType } from '@/types/story';
import { AddChildDialog } from './AddChildDialog';
import { SplitStoryDialog, SplitConfig } from '@/components/stories/SplitStoryDialog';

interface LocalBacklogListProps {
  items: LocalBacklogItem[];
  onUpdateItem: (id: string, updates: Partial<LocalBacklogItem>) => void;
  onDeleteItem: (id: string) => void;
  onReorderItems: (updates: { id: string; backlog_position: number }[]) => void;
  onAddItem?: (item: LocalBacklogItemInput) => void;
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

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'epic', label: 'Epics' },
  { value: 'feature', label: 'Features' },
  { value: 'story', label: 'Stories' },
];

export const LocalBacklogList: React.FC<LocalBacklogListProps> = ({ 
  items, 
  onUpdateItem, 
  onDeleteItem, 
  onReorderItems,
  onAddItem,
  isEditable = true 
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('hierarchical');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Dialog state
  const [editingItem, setEditingItem] = useState<LocalBacklogItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addChildParent, setAddChildParent] = useState<LocalBacklogItem | null>(null);
  const [splitItem, setSplitItem] = useState<LocalBacklogItem | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && item.item_type !== typeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [items, statusFilter, priorityFilter, typeFilter, searchQuery]);

  // Get children count for an item
  const getChildrenCount = useCallback((parentId: string) => {
    return items.filter(item => item.parent_item_id === parentId).length;
  }, [items]);

  // Get children of an item
  const getChildren = useCallback((parentId: string) => {
    return filteredItems.filter(item => item.parent_item_id === parentId);
  }, [filteredItems]);

  // Get root items (no parent or parent not in filtered items)
  const rootItems = useMemo(() => {
    if (viewMode === 'flat') return filteredItems;
    return filteredItems.filter(item => !item.parent_item_id);
  }, [filteredItems, viewMode]);

  // Toggle expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

  const handleAddChild = (item: LocalBacklogItemInput) => {
    onAddItem?.(item);
    setAddChildParent(null);
    // Expand the parent to show the new child
    if (addChildParent) {
      setExpandedItems(prev => new Set(prev).add(addChildParent.id));
    }
  };

  const handleSplit = async (config: SplitConfig) => {
    if (!splitItem || !onAddItem) return;
    
    const parentCriteria = splitItem.acceptance_criteria || [];
    
    // Create child items from selected criteria
    config.childStories.forEach((child) => {
      if (child.enabled) {
        const criteria = parentCriteria[child.criteriaIndex];
        const newItem: LocalBacklogItemInput = {
          title: child.title,
          description: criteria,
          acceptance_criteria: [criteria],
          priority: config.inheritPriority ? splitItem.priority : 'medium',
          status: 'idea',
          source: splitItem.source,
          estimated_value: null,
          estimated_effort: null,
          tags: splitItem.tags,
          target_release: splitItem.target_release,
          item_type: 'story',
          parent_item_id: splitItem.id,
        };
        onAddItem(newItem);
      }
    });

    // Optionally remove criteria from parent
    if (config.removeFromParent && parentCriteria.length > 0) {
      const selectedIndices = new Set(
        config.childStories.filter(c => c.enabled).map(c => c.criteriaIndex)
      );
      const remainingCriteria = parentCriteria.filter(
        (_, index) => !selectedIndices.has(index)
      );
      onUpdateItem(splitItem.id, { acceptance_criteria: remainingCriteria });
    }

    // Expand parent to show children
    setExpandedItems(prev => new Set(prev).add(splitItem.id));
    setSplitItem(null);
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
      story_points: item.estimated_effort,
      estimated_effort: item.estimated_effort,
      target_release: item.target_release,
      tags: item.tags,
      user_story_id: item.user_story_id,
      item_type: item.item_type,
      parent_item_id: item.parent_item_id,
    };
  };

  // Render item with children recursively
  const renderItem = (item: LocalBacklogItem, index: number, indentLevel: number = 0) => {
    const childrenCount = getChildrenCount(item.id);
    const isExpanded = expandedItems.has(item.id);
    const children = isExpanded ? getChildren(item.id) : [];

    return (
      <React.Fragment key={item.id}>
        <div
          draggable={isEditable && viewMode === 'flat'}
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
            childrenCount={childrenCount}
            onAddChild={onAddItem && item.item_type !== 'story' ? () => setAddChildParent(item) : undefined}
            onSplitByCriteria={(item.acceptance_criteria?.length || 0) >= 2 && onAddItem ? () => setSplitItem(item) : undefined}
            indentLevel={indentLevel}
            isExpanded={isExpanded}
            onToggleExpand={childrenCount > 0 ? () => toggleExpand(item.id) : undefined}
          />
        </div>
        {/* Render children */}
        {isExpanded && children.map((child, childIndex) => 
          renderItem(child, index + childIndex + 1, indentLevel + 1)
        )}
      </React.Fragment>
    );
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
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[140px]">
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

        {/* View mode toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'hierarchical' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('hierarchical')}
            title="Hierarchical view"
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('flat')}
            title="Flat view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
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
          {viewMode === 'flat' 
            ? filteredItems.map((item, index) => renderItem(item, index, 0))
            : rootItems.map((item, index) => renderItem(item, index, 0))
          }
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

      {/* Add Child Dialog */}
      {addChildParent && (
        <AddChildDialog
          open={!!addChildParent}
          onOpenChange={(open) => !open && setAddChildParent(null)}
          parent={addChildParent}
          onAddChild={handleAddChild}
        />
      )}

      {/* Split Story Dialog */}
      {splitItem && (
        <SplitStoryDialog
          open={!!splitItem}
          onOpenChange={(open) => !open && setSplitItem(null)}
          backlogItem={{
            ...splitItem,
            project_id: null,
            product_id: null,
            user_story_id: splitItem.user_story_id || null,
            backlog_position: splitItem.backlog_position,
            created_at: null,
            created_by: null,
            updated_at: null,
          } as any}
          onSplit={handleSplit}
        />
      )}
    </div>
  );
};
