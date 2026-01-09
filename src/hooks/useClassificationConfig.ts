import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClassificationConfig {
  id: string;
  classification_type: 'categories' | 'planning-focuses' | 'activity-domains' | 'decision-levels';
  is_visible: boolean;
  display_order: number;
  custom_label: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export const useClassificationConfig = () => {
  return useQuery({
    queryKey: ['classification-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classification_config')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as ClassificationConfig[];
    },
  });
};

export const useUpdateClassificationConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<ClassificationConfig> 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('classification_config')
        .update({ 
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification-config'] });
      toast({
        title: 'Configuration updated',
        description: 'Classification settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update configuration: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useVisibleClassifications = () => {
  const { data: configs } = useClassificationConfig();
  
  return {
    categories: configs?.find(c => c.classification_type === 'categories')?.is_visible ?? true,
    // Keep planningFocuses for backward compatibility but also add decisionLevels
    planningFocuses: configs?.find(c => c.classification_type === 'planning-focuses')?.is_visible ?? true,
    decisionLevels: configs?.find(c => c.classification_type === 'decision-levels')?.is_visible ?? true,
    activityDomains: configs?.find(c => c.classification_type === 'activity-domains')?.is_visible ?? true,
    getLabel: (type: string) => {
      const config = configs?.find(c => c.classification_type === type);
      if (config?.custom_label) return config.custom_label;
      // Default labels
      const defaultLabels: Record<string, string> = {
        'categories': 'Categories',
        'decision-levels': 'Decision Levels',
        'activity-domains': 'Activity Domains',
        'planning-focuses': 'Planning Focuses'
      };
      return defaultLabels[type] || type;
    },
  };
};
