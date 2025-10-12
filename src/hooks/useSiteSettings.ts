import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export interface QuickLink {
  label: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  id: string;
  company_name: string | null;
  company_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_location: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  social_github: string | null;
  quick_links: QuickLink[] | null;
  copyright_text: string | null;
}

export const useSiteSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      const { data, error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', SETTINGS_ID)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: 'Settings updated',
        description: 'Footer settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating settings:', error);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
  };
};
