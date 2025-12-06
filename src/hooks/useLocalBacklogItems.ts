import { useState, useCallback } from 'react';

export interface LocalBacklogItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  source: string | null;
  estimated_value: number | null;
  estimated_effort: number | null;
  tags: string[] | null;
  target_release: string | null;
  backlog_position: number;
}

export type LocalBacklogItemInput = Omit<LocalBacklogItem, 'id' | 'backlog_position'>;

export function useLocalBacklogItems(initialItems: LocalBacklogItem[] = []) {
  const [items, setItems] = useState<LocalBacklogItem[]>(initialItems);

  const addItem = useCallback((input: LocalBacklogItemInput) => {
    const newItem: LocalBacklogItem = {
      ...input,
      id: crypto.randomUUID(),
      backlog_position: items.length,
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
    setItems(prev => prev.filter(item => item.id !== id));
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

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    clearItems,
    setAllItems,
    hasItems: items.length > 0,
  };
}
