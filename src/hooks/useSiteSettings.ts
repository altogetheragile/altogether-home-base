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
  show_events: boolean | null;
  show_knowledge: boolean | null;
  show_blog: boolean | null;
  show_ai_tools: boolean | null;
  show_contact: boolean | null;
  show_admin_routes: boolean | null;
  show_protected_projects: boolean | null;
  show_dynamic_pages: boolean | null;
  show_dashboard: boolean | null;
  show_recommendations: boolean | null;
  show_testimonial_name: boolean | null;
  show_testimonial_company: boolean | null;
  show_testimonial_rating_header: boolean | null;
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
      // 1. Update site_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', SETTINGS_ID)
        .select()
        .single();

      if (settingsError) throw settingsError;

      // 2. Update pages.is_published for special pages
      const pageUpdates = [];
      
      if ('show_blog' in updates) {
        pageUpdates.push(
          supabase
            .from('pages')
            .update({ is_published: updates.show_blog ?? false })
            .eq('slug', 'blog')
        );
      }
      
      if ('show_events' in updates) {
        pageUpdates.push(
          supabase
            .from('pages')
            .update({ is_published: updates.show_events ?? false })
            .eq('slug', 'events')
        );
      }
      
      if ('show_knowledge' in updates) {
        pageUpdates.push(
          supabase
            .from('pages')
            .update({ is_published: updates.show_knowledge ?? false })
            .eq('slug', 'knowledge')
        );
      }

      // Execute all page updates in parallel
      if (pageUpdates.length > 0) {
        const results = await Promise.all(pageUpdates);
        const pageError = results.find(r => r.error);
        if (pageError) throw pageError.error;
      }

      return settingsData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      // Also invalidate specific page queries
      queryClient.invalidateQueries({ queryKey: ['page', 'blog'] });
      queryClient.invalidateQueries({ queryKey: ['page', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['page', 'knowledge'] });
      
      toast({
        title: 'Settings updated',
        description: 'Site settings and page visibility have been saved successfully.',
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
