import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserStory } from './useUserStories';
import { BacklogItem } from './useBacklogItems';
import { SplitConfig } from '@/components/stories/SplitStoryDialog';

interface SplitUserStoryParams {
  parentStory: UserStory;
  config: SplitConfig;
}

interface SplitBacklogItemParams {
  parentItem: BacklogItem;
  config: SplitConfig;
}

// Hook to fetch child stories for a parent
export function useChildStories(parentStoryId?: string) {
  return useQuery({
    queryKey: ['user-stories', 'children', parentStoryId],
    queryFn: async () => {
      if (!parentStoryId) return [];
      
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('parent_story_id', parentStoryId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as UserStory[];
    },
    enabled: !!parentStoryId,
  });
}

// Hook to fetch child backlog items for a parent
export function useChildBacklogItems(parentItemId?: string) {
  return useQuery({
    queryKey: ['backlog-items', 'children', parentItemId],
    queryFn: async () => {
      if (!parentItemId) return [];
      
      const { data, error } = await supabase
        .from('backlog_items')
        .select('*')
        .eq('parent_item_id', parentItemId)
        .order('backlog_position', { ascending: true });
      
      if (error) throw error;
      return data as BacklogItem[];
    },
    enabled: !!parentItemId,
  });
}

export function useSplitUserStory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ parentStory, config }: SplitUserStoryParams) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const acceptanceCriteria = parentStory.acceptance_criteria || [];
      
      // Create child stories
      const childStoriesData = config.childStories.map((child, index) => ({
        title: child.title,
        description: `Split from: ${parentStory.title}\n\nOriginal criteria: ${acceptanceCriteria[child.criteriaIndex]}`,
        acceptance_criteria: [acceptanceCriteria[child.criteriaIndex]],
        status: 'draft' as const,
        priority: config.inheritPriority ? parentStory.priority : 'medium' as const,
        issue_type: parentStory.issue_type,
        epic_id: parentStory.epic_id,
        feature_id: parentStory.feature_id,
        parent_story_id: parentStory.id,
        created_by: user.user.id,
        updated_by: user.user.id,
        position: (parentStory.position || 0) + index + 1,
      }));

      const { data: createdStories, error: createError } = await supabase
        .from('user_stories')
        .insert(childStoriesData)
        .select();

      if (createError) throw createError;

      // Optionally remove split criteria from parent
      if (config.removeFromParent) {
        const remainingCriteria = acceptanceCriteria.filter(
          (_, index) => !config.selectedCriteria.includes(index)
        );

        const { error: updateError } = await supabase
          .from('user_stories')
          .update({ 
            acceptance_criteria: remainingCriteria,
            updated_by: user.user.id,
          })
          .eq('id', parentStory.id);

        if (updateError) throw updateError;
      }

      return createdStories;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
      toast({
        title: 'Stories created',
        description: `Successfully split into ${data?.length || 0} child stories.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error splitting story',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSplitBacklogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ parentItem, config }: SplitBacklogItemParams) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const acceptanceCriteria = parentItem.acceptance_criteria || [];
      
      // Get max position for this project
      const { data: maxPosData } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', parentItem.project_id || '')
        .order('backlog_position', { ascending: false })
        .limit(1);
      
      const maxPosition = maxPosData?.[0]?.backlog_position ?? -1;

      // Create child backlog items
      const childItemsData = config.childStories.map((child, index) => ({
        title: child.title,
        description: `Split from: ${parentItem.title}\n\nOriginal criteria: ${acceptanceCriteria[child.criteriaIndex]}`,
        acceptance_criteria: [acceptanceCriteria[child.criteriaIndex]],
        status: 'idea',
        priority: config.inheritPriority ? parentItem.priority : 'medium',
        project_id: parentItem.project_id,
        product_id: parentItem.product_id,
        parent_item_id: parentItem.id,
        created_by: user.user.id,
        backlog_position: maxPosition + index + 1,
        source: parentItem.source,
      }));

      const { data: createdItems, error: createError } = await supabase
        .from('backlog_items')
        .insert(childItemsData)
        .select();

      if (createError) throw createError;

      // Optionally remove split criteria from parent
      if (config.removeFromParent) {
        const remainingCriteria = acceptanceCriteria.filter(
          (_, index) => !config.selectedCriteria.includes(index)
        );

        const { error: updateError } = await supabase
          .from('backlog_items')
          .update({ acceptance_criteria: remainingCriteria })
          .eq('id', parentItem.id);

        if (updateError) throw updateError;
      }

      return createdItems;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({
        title: 'Backlog items created',
        description: `Successfully split into ${data?.length || 0} child items.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error splitting backlog item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
