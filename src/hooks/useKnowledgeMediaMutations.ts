import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface MediaItem {
  id?: string;
  type: 'image' | 'video' | 'document' | 'embed';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  position: number;
  technique_id?: string;
}

export const useKnowledgeMediaMutations = () => {
  const queryClient = useQueryClient();

  const updateTechniqueMedia = useMutation({
    mutationFn: async ({ techniqueId, mediaItems }: { techniqueId: string; mediaItems: MediaItem[] }) => {
      // First, delete existing media for this technique
      await supabase
        .from('knowledge_media')
        .delete()
        .eq('technique_id', techniqueId);

      // Then insert new media items
      if (mediaItems.length > 0) {
        const mediaToInsert = mediaItems.map((item, index) => ({
          technique_id: techniqueId,
          type: item.type,
          title: item.title,
          description: item.description,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
          position: index
        }));

        const { error } = await supabase
          .from('knowledge_media')
          .insert(mediaToInsert);

        if (error) throw error;
      }

      return { techniqueId, mediaItems };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-techniques'] });
      toast({
        title: "Success",
        description: "Media updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating media:', error);
      toast({
        title: "Error",
        description: "Failed to update media",
        variant: "destructive"
      });
    }
  });

  return {
    updateTechniqueMedia
  };
};