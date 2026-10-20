import React, { useState, useCallback, useMemo } from 'react';
import { LocalBacklogItem, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import type { BacklogItem } from '@/hooks/useBacklogItems';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Layers, List } from 'lucide-react';
import { UnifiedStoryEditDialog } from '@/components/stories/UnifiedStoryEditDialog';
import { useActiveScheme } from '@/components/backlog/SchemeContext';
import { UnifiedStoryData } from '@/types/story';
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
  const scheme = useActiveScheme();
  // Priority filter options follow the active scheme; scored schemes (WSJF) have no
  // discrete priority to filter by.
  const priorityFilters = [
    { value: 'all', label: 'All Priorities' },
    ...(scheme.type === 'ordinal' ? (scheme.options || []).map((o) => ({ value: o.value, label: o.label })) : []),
  ];
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('hierarchical');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} item${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`)) return;
    selectedIds.forEach((id) => onDeleteItem(id));
    setSelectedIds(new Set());
  };
  
  // Dialog state
  const [editingItem, setEditingItem] = useState<LocalBacklogItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addChildParent, setAddChildParent] = useState<LocalBacklogItem | null>(null);
  const [splitItem, setSplitItem] = useState<LocalBacklogItem | null>(null);

  // A Done item is part of the Increment, not work still to order, so it leaves the list
  // unless asked for (as in the zoo game). It is hidden, never deleted: the Sprint Review and
  // provenance still need it.
  const [showDone, setShowDone] = useState(false);
  const doneCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (statusFilter === 'all' && !showDone && item.status === 'done') return false;
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
  }, [items, statusFilter, priorityFilter, typeFilter, searchQuery, showDone]);

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
    const shown = new Set(filteredItems.map((i) => i.id));
    return filteredItems.filter(item => !item.parent_item_id || !shown.has(item.parent_item_id));
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

  // Order is kept by item, not by row number: the grouped view numbers only the top level,
  // and a filter hides items, so a row's index is not its place in the backlog.
  const siblingsOf = (item: LocalBacklogItem) =>
    viewMode === 'flat'
      ? filteredItems
      : filteredItems.filter((i) => (i.parent_item_id ?? null) === (item.parent_item_id ?? null));

  const moveItem = useCallback((fromId: string, toId: string) => {
    const all = [...items].sort((a, b) => a.backlog_position - b.backlog_position);
    const from = all.findIndex((i) => i.id === fromId);
    const to = all.findIndex((i) => i.id === toId);
    if (from === -1 || to === -1 || from === to) return;
    const [moved] = all.splice(from, 1);
    all.splice(to, 0, moved);
    onReorderItems(all.map((item, idx) => ({ id: item.id, backlog_position: idx })));
  }, [items, onReorderItems]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditable) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: LocalBacklogItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Read the id off the drag itself; state set at dragstart may not have rendered yet
    const fromId = e.dataTransfer?.getData('text/plain') || draggedId;
    const dragged = items.find((i) => i.id === fromId);
    setDraggedId(null);
    if (!isEditable || !dragged || dragged.id === target.id) return;
    // In the grouped view an item moves among its own siblings; changing parent is an edit
    if (viewMode === 'hierarchical' && (dragged.parent_item_id ?? null) !== (target.parent_item_id ?? null)) return;
    moveItem(dragged.id, target.id);
  };

  const neighbour = (item: LocalBacklogItem, step: -1 | 1) => {
    const siblings = siblingsOf(item);
    return siblings[siblings.findIndex((i) => i.id === item.id) + step];
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
        priority_data: data.priority_data ?? undefined,
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
      priority: item.priority || undefined,
      priority_data: item.priority_data ?? undefined,
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
    const above = neighbour(item, -1);
    const below = neighbour(item, 1);
    const isExpanded = expandedItems.has(item.id);
    const children = isExpanded ? getChildren(item.id) : [];

    return (
      <React.Fragment key={item.id}>
        <div
          draggable={isEditable}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item)}
          onDragEnd={() => setDraggedId(null)}
          className={draggedId === item.id ? 'opacity-50' : ''}
        >
          <div className="flex items-start gap-2">
            {isEditable && (
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                aria-label="Select for bulk delete"
                className="mt-3 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <LocalBacklogItemCard
                item={item}
                index={index}
                onUpdate={(updates) => onUpdateItem(item.id, updates)}
                onDelete={() => onDeleteItem(item.id)}
                onEdit={() => handleEdit(item)}
                onMoveUp={isEditable && above ? () => moveItem(item.id, above.id) : undefined}
                onMoveDown={isEditable && below ? () => moveItem(item.id, below.id) : undefined}
                isDragging={draggedId === item.id}
                isEditable={isEditable}
                childrenCount={childrenCount}
                onAddChild={onAddItem && item.item_type !== 'story' ? () => setAddChildParent(item) : undefined}
                onSplitByCriteria={(item.acceptance_criteria?.length || 0) >= 2 && onAddItem ? () => setSplitItem(item) : undefined}
                indentLevel={indentLevel}
                isExpanded={isExpanded}
                onToggleExpand={childrenCount > 0 ? () => toggleExpand(item.id) : undefined}
              />
            </div>
          </div>
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
        
        {scheme.type === 'ordinal' && (
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityFilters.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}

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

      {/* Bulk actions */}
      {isEditable && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete selected</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {items.length === 0
            ? "No backlog items yet. Add your first item above!"
            : doneCount === items.length && !showDone && statusFilter === 'all'
              ? "Everything on this backlog is Done."
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

      {doneCount > 0 && statusFilter === 'all' && (
        <div className="text-center">
          <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setShowDone((v) => !v)}>
            {showDone ? 'Hide done' : `Show done (${doneCount})`}
          </Button>
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
          } as unknown as BacklogItem}
          onSplit={handleSplit}
        />
      )}
    </div>
  );
};
