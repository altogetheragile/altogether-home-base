import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useViewTracking = (techniqueId: string) => {
  const trackView = useMutation({
    mutationFn: async () => {
      // Increment view count
      const { error } = await supabase.rpc('increment_view_count', {
        technique_id: techniqueId
      });
      
      if (error) {
        // Fallback: update view count manually
        const { data: currentTechnique } = await supabase
          .from('knowledge_techniques')
          .select('view_count')
          .eq('id', techniqueId)
          .single();
        
        if (currentTechnique) {
          await supabase
            .from('knowledge_techniques')
            .update({ view_count: (currentTechnique.view_count || 0) + 1 })
            .eq('id', techniqueId);
        }
      }
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      trackView.mutate();
    }, 2000); // Track after 2 seconds to ensure genuine view

    return () => clearTimeout(timer);
  }, [techniqueId]);

  return trackView;
};