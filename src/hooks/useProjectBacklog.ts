import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ItemType } from '@/types/story';
import type { LocalBacklogItem, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';

// Relational-backed backlog for a project. Mirrors the useLocalBacklogItems
// interface so ProductBacklog can swap to it transparently when a project is
// open. The relational backlog_items table is the single source of truth (see
// docs/VISION_TO_VALUE.md backlog dual-model note); every mutation persists
// immediately, so there is no separate "Save to Project" snapshot in project mode.

const mapRow = (item: Record<string, unknown>, index: number): LocalBacklogItem => ({
  id: String(item.id),
  title: String(item.title ?? ''),
  description: (item.description as string) ?? null,
  acceptance_criteria: (item.acceptance_criteria as string[]) ?? null,
  priority: (item.priority as string) || 'medium',
  status: (item.status as string) || 'idea',
  source: (item.source as string) ?? null,
  estimated_value: (item.estimated_value as number) ?? null,
  estimated_effort: (item.estimated_effort as number) ?? null,
  tags: (item.tags as string[]) ?? null,
  target_release: (item.target_release as string) ?? null,
  backlog_position: (item.backlog_position as number) ?? index,
  item_type: ((item.item_type as string) || 'story') as ItemType,
  parent_item_id: (item.parent_item_id as string) ?? null,
});

export function useProjectBacklog(projectId?: string) {
  const queryClient = useQueryClient();
  const key = ['backlog-items', projectId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_items')
        .select('*')
        .eq('project_id', projectId!)
        .order('backlog_position', { ascending: true });
      if (error) throw error;
      return (data || []).map((row, i) => mapRow(row as Record<string, unknown>, i));
    },
    enabled: !!projectId,
  });

  const items = useMemo<LocalBacklogItem[]>(() => data || [], [data]);
  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: key }), [queryClient, projectId]);

  const addItem = useCallback(async (input: LocalBacklogItemInput) => {
    if (!projectId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('backlog_items').insert({
      project_id: projectId,
      title: input.title,
      description: input.description,
      acceptance_criteria: input.acceptance_criteria,
      priority: input.priority,
      status: input.status,
      source: input.source,
      estimated_value: input.estimated_value,
      estimated_effort: input.estimated_effort,
      tags: input.tags,
      target_release: input.target_release,
      item_type: input.item_type || 'story',
      parent_item_id: input.parent_item_id ?? null,
      backlog_position: items.length,
      created_by: user?.id ?? null,
    });
    if (error) { toast.error('Failed to add item: ' + error.message); return; }
    invalidate();
  }, [projectId, items.length, invalidate]);

  const updateItem = useCallback(async (id: string, updates: Partial<LocalBacklogItem>) => {
    const { error } = await supabase.from('backlog_items').update(updates).eq('id', id);
    if (error) { toast.error('Failed to update item: ' + error.message); return; }
    invalidate();
  }, [invalidate]);

  const deleteItem = useCallback(async (id: string) => {
    // Delete the item and all descendants (parent_item_id chain).
    const ids = new Set<string>([id]);
    const collect = (parentId: string) => {
      items.forEach((it) => {
        if (it.parent_item_id === parentId && !ids.has(it.id)) {
          ids.add(it.id);
          collect(it.id);
        }
      });
    };
    collect(id);
    const { error } = await supabase.from('backlog_items').delete().in('id', Array.from(ids));
    if (error) { toast.error('Failed to delete item: ' + error.message); return; }
    invalidate();
  }, [items, invalidate]);

  const reorderItems = useCallback(async (updates: { id: string; backlog_position: number }[]) => {
    for (const u of updates) {
      await supabase.from('backlog_items').update({ backlog_position: u.backlog_position }).eq('id', u.id);
    }
    invalidate();
  }, [invalidate]);

  // No-ops in relational mode (data lives in the table, not local state).
  const clearItems = useCallback(() => {}, []);
  const setAllItems = useCallback(() => {}, []);

  // Hierarchy helpers (same pure logic as the local hook).
  const getChildren = useCallback((parentId: string) => items.filter((i) => i.parent_item_id === parentId), [items]);
  const rootItems = useMemo(() => items.filter((i) => !i.parent_item_id), [items]);
  const getItemsByType = useCallback((type: ItemType) => items.filter((i) => i.item_type === type), [items]);
  const getPotentialParents = useCallback((childType: ItemType, excludeId?: string) =>
    items.filter((i) => {
      if (i.id === excludeId) return false;
      if (childType === 'feature') return i.item_type === 'epic';
      if (childType === 'story') return i.item_type === 'epic' || i.item_type === 'feature';
      return false;
    }), [items]);
  const getChildrenCount = useCallback((parentId: string) => items.filter((i) => i.parent_item_id === parentId).length, [items]);

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    clearItems,
    setAllItems,
    hasItems: items.length > 0,
    getChildren,
    rootItems,
    getItemsByType,
    getPotentialParents,
    getChildrenCount,
  };
}
