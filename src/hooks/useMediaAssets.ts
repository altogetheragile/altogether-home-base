import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'document' | 'embed' | 'template' | 'text' | 'archive';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  original_filename?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  is_template?: boolean;
  template_category?: string;
  template_version?: string;
  usage_count?: number;
  is_public?: boolean;
}

export interface MediaAssetInsert {
  type: 'image' | 'video' | 'document' | 'embed' | 'template' | 'text' | 'archive';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  original_filename?: string;
  is_template?: boolean;
  template_category?: string;
  template_version?: string;
  usage_count?: number;
  is_public?: boolean;
}

export const useMediaAssets = () => {
  return useQuery({
    queryKey: ['media-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaAsset[];
    }
  });
};

export const useMediaAssetMutations = () => {
  const queryClient = useQueryClient();

  const createMediaAsset = useMutation({
    mutationFn: async (mediaAsset: MediaAssetInsert) => {
      const { data, error } = await supabase
        .from('media_assets')
        .insert({
          ...mediaAsset,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as MediaAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      toast({
        title: "Success",
        description: "Media asset created successfully"
      });
    },
    onError: (error) => {
      console.error('Error creating media asset:', error);
      toast({
        title: "Error",
        description: "Failed to create media asset",
        variant: "destructive"
      });
    }
  });

  const updateMediaAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaAssetInsert> }) => {
      const { data, error } = await supabase
        .from('media_assets')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as MediaAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      toast({
        title: "Success",
        description: "Media asset updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating media asset:', error);
      toast({
        title: "Error",
        description: "Failed to update media asset",
        variant: "destructive"
      });
    }
  });

  const deleteMediaAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      toast({
        title: "Success",
        description: "Media asset deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting media asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete media asset",
        variant: "destructive"
      });
    }
  });

  return {
    createMediaAsset,
    updateMediaAsset,
    deleteMediaAsset
  };
};

// Hook for managing knowledge item media associations
export const useKnowledgeItemMedia = (knowledgeItemId?: string) => {
  return useQuery({
    queryKey: ['knowledge-item-media', knowledgeItemId],
    queryFn: async () => {
      if (!knowledgeItemId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_items_media')
        .select(`
          position,
          media_asset_id,
          media_assets (
            id,
            type,
            title,
            description,
            url,
            thumbnail_url,
            file_size,
            file_type,
            original_filename,
            created_at,
            updated_at,
            created_by,
            updated_by,
            is_template,
            template_category,
            template_version,
            usage_count,
            is_public
          )
        `)
        .eq('knowledge_item_id', knowledgeItemId)
        .order('position');
      
      if (error) throw error;
      
      return data
        .filter(item => item.media_assets && typeof item.media_assets === 'object')
        .map(item => {
          const asset = item.media_assets as any;
          return {
            id: asset.id,
            type: asset.type,
            title: asset.title,
            description: asset.description,
            url: asset.url,
            thumbnail_url: asset.thumbnail_url,
            file_size: asset.file_size,
            file_type: asset.file_type,
            original_filename: asset.original_filename,
            created_at: asset.created_at,
            updated_at: asset.updated_at,
            created_by: asset.created_by,
            updated_by: asset.updated_by,
            is_template: asset.is_template,
            template_category: asset.template_category,
            template_version: asset.template_version,
            usage_count: asset.usage_count,
            is_public: asset.is_public,
            position: item.position
          } as MediaAsset & { position: number };
        });
    },
    enabled: !!knowledgeItemId
  });
};

export const useKnowledgeItemMediaMutations = () => {
  const queryClient = useQueryClient();

  const updateKnowledgeItemMedia = useMutation({
    mutationFn: async ({ 
      knowledgeItemId, 
      mediaAssetIds 
    }: { 
      knowledgeItemId: string; 
      mediaAssetIds: string[] 
    }) => {
      // First, delete existing associations
      await supabase
        .from('knowledge_items_media')
        .delete()
        .eq('knowledge_item_id', knowledgeItemId);

      // Then insert new associations
      if (mediaAssetIds.length > 0) {
        const associations = mediaAssetIds.map((mediaAssetId, index) => ({
          knowledge_item_id: knowledgeItemId,
          media_asset_id: mediaAssetId,
          position: index
        }));

        const { error } = await supabase
          .from('knowledge_items_media')
          .insert(associations);

        if (error) throw error;
      }

      return { knowledgeItemId, mediaAssetIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-media', data.knowledgeItemId] 
      });
      toast({
        title: "Success",
        description: "Knowledge item media updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating knowledge item media:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge item media",
        variant: "destructive"
      });
    }
  });

  return {
    updateKnowledgeItemMedia
  };
};