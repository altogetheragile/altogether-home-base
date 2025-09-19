import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useCheckExistingTemplate = (title: string) => {
  return useQuery({
    queryKey: ['check-template-exists', title],
    queryFn: async () => {
      if (!title.trim()) return null;
      
      const { data, error } = await supabase
        .from('knowledge_templates')
        .select('id, title, version')
        .eq('title', title)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!title.trim(),
  });
};

export const useGetNextVersion = (title: string) => {
  return useQuery({
    queryKey: ['next-template-version', title],
    queryFn: async () => {
      if (!title.trim()) return '1.0';
      
      const { data, error } = await supabase
        .rpc('get_next_template_version', { template_title: title });

      if (error) throw error;
      return data as string;
    },
    enabled: !!title.trim(),
  });
};