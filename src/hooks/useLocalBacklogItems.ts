import { useState, useCallback, useMemo } from 'react';
import { ItemType } from '@/types/story';

export interface LocalBacklogItem {
  id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string[] | null;
  priority: string;
  status: string;
  source: string | null;
  estimated_value: number | null;
  estimated_effort: number | null;
  tags: string[] | null;
  target_release: string | null;
  backlog_position: number;
  user_story_id?: string | null;
  // Hierarchy fields
  item_type: ItemType;
  parent_item_id?: string | null;
}

export type LocalBacklogItemInput = Omit<LocalBacklogItem, 'id' | 'backlog_position'>;

export function useLocalBacklogItems(initialItems: LocalBacklogItem[] = []) {
  const [items, setItems] = useState<LocalBacklogItem[]>(initialItems);

  const addItem = useCallback((input: LocalBacklogItemInput) => {
    const newItem: LocalBacklogItem = {
      ...input,
      id: crypto.randomUUID(),
      backlog_position: items.length,
      item_type: input.item_type || 'story',
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [items.length]);

  const updateItem = useCallback((id: string, updates: Partial<LocalBacklogItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      // Also delete all children
      const itemToDelete = prev.find(item => item.id === id);
      if (!itemToDelete) return prev;
      
      const idsToDelete = new Set<string>([id]);
      
      // Recursively find all children
      const findChildren = (parentId: string) => {
        prev.forEach(item => {
          if (item.parent_item_id === parentId) {
            idsToDelete.add(item.id);
            findChildren(item.id);
          }
        });
      };
      findChildren(id);
      
      return prev.filter(item => !idsToDelete.has(item.id));
    });
  }, []);

  const reorderItems = useCallback((updates: { id: string; backlog_position: number }[]) => {
    setItems(prev => {
      const newItems = [...prev];
      updates.forEach(({ id, backlog_position }) => {
        const index = newItems.findIndex(item => item.id === id);
        if (index !== -1) {
          newItems[index] = { ...newItems[index], backlog_position };
        }
      });
      return newItems.sort((a, b) => a.backlog_position - b.backlog_position);
    });
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const setAllItems = useCallback((newItems: LocalBacklogItem[]) => {
    setItems(newItems);
  }, []);

  // Get children of a specific item
  const getChildren = useCallback((parentId: string) => {
    return items.filter(item => item.parent_item_id === parentId);
  }, [items]);

  // Get root items (no parent)
  const rootItems = useMemo(() => {
    return items.filter(item => !item.parent_item_id);
  }, [items]);

  // Get items by type
  const getItemsByType = useCallback((type: ItemType) => {
    return items.filter(item => item.item_type === type);
  }, [items]);

  // Get potential parents for a given item type
  const getPotentialParents = useCallback((childType: ItemType, excludeId?: string) => {
    return items.filter(item => {
      if (item.id === excludeId) return false;
      if (childType === 'feature') return item.item_type === 'epic';
      if (childType === 'story') return item.item_type === 'epic' || item.item_type === 'feature';
      return false;
    });
  }, [items]);

  // Count children of an item
  const getChildrenCount = useCallback((parentId: string) => {
    return items.filter(item => item.parent_item_id === parentId).length;
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    clearItems,
    setAllItems,
    hasItems: items.length > 0,
    // Hierarchy helpers
    getChildren,
    rootItems,
    getItemsByType,
    getPotentialParents,
    getChildrenCount,
  };
}
