import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptance_criteria?: string[];
  story_points?: number;
  status: 'draft' | 'ready' | 'in_progress' | 'testing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  issue_type: 'epic' | 'story' | 'task' | 'bug';
  epic_id?: string;
  feature_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  jira_issue_key?: string;
  position?: number;
  
  // Parent-child relationship for split stories
  parent_story_id?: string;
  
  // Rich metadata fields (Phase 1 enhancements)
  user_persona?: string;
  problem_statement?: string;
  business_value?: string;
  assumptions_risks?: string;
  dependencies?: string[];
  technical_notes?: string;
  design_notes?: string;
  ui_mockup_url?: string;
  definition_of_ready?: {
    items: Array<{ label: string; checked: boolean }>;
  };
  definition_of_done?: {
    items: Array<{ label: string; checked: boolean }>;
  };
  tags?: string[];
  story_type?: 'feature' | 'spike' | 'bug' | 'chore' | 'task';
  sprint?: string;
  impact_effort_matrix?: {
    impact?: number;
    effort?: number;
  };
  evidence_links?: string[];
  non_functional_requirements?: string[];
  customer_journey_stage?: string;
  confidence_level?: number;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  jira_issue_key?: string;
  position?: number;
  project_id?: string;
  
  // Phase 1 enhancements
  business_objective?: string;
  success_metrics?: string[];
  stakeholders?: string[];
  start_date?: string;
  target_date?: string;
}

export interface Feature {
  id: string;
  title: string;
  description?: string;
  epic_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  jira_issue_key?: string;
  position?: number;
  project_id?: string;
  
  // Phase 1 enhancements
  user_value?: string;
  acceptance_criteria?: string[];
  status?: 'draft' | 'in_progress' | 'completed';
}

export function useUserStories() {
  return useQuery({
    queryKey: ['user-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as UserStory[];
    },
  });
}

export function useEpics() {
  return useQuery({
    queryKey: ['epics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epics')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Epic[];
    },
  });
}

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Feature[];
    },
  });
}

export function useUserStoriesByEpic(epicId?: string) {
  return useQuery({
    queryKey: ['user-stories', 'by-epic', epicId],
    queryFn: async () => {
      if (!epicId) return [];
      
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('epic_id', epicId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as UserStory[];
    },
    enabled: !!epicId,
  });
}

export function useStoryMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createStory = useMutation({
    mutationFn: async (story: Omit<UserStory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_stories')
        .insert({
          ...story,
          created_by: user.user.id,
          updated_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
      toast({
        title: "Story created",
        description: "User story has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserStory> & { id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_stories')
        .update({
          ...updates,
          updated_by: user.user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
      toast({
        title: "Story updated",
        description: "User story has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
      toast({
        title: "Story deleted",
        description: "User story has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createEpic = useMutation({
    mutationFn: async (epic: Omit<Epic, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('epics')
        .insert({
          ...epic,
          created_by: user.user.id,
          updated_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      toast({
        title: "Epic created",
        description: "Epic has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating epic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEpic = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Epic> & { id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('epics')
        .update({
          ...updates,
          updated_by: user.user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      toast({
        title: "Epic updated",
        description: "Epic has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating epic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createFeature = useMutation({
    mutationFn: async (feature: Omit<Feature, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('features')
        .insert({
          ...feature,
          created_by: user.user.id,
          updated_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast({
        title: "Feature created",
        description: "Feature has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating feature",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBulkStories = useMutation({
    mutationFn: async (stories: Array<Omit<UserStory, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const storiesWithUser = stories.map(story => ({
        ...story,
        created_by: user.user.id,
        updated_by: user.user.id,
      }));

      const { data, error } = await supabase
        .from('user_stories')
        .insert(storiesWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
      toast({
        title: "Stories created",
        description: `${data?.length || 0} user stories have been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating stories",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createStory,
    updateStory,
    deleteStory,
    createEpic,
    updateEpic,
    createFeature,
    createBulkStories,
  };
}