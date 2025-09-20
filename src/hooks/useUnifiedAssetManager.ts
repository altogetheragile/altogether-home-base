import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UnifiedAsset {
  id: string;
  type: 'image' | 'video' | 'document' | 'embed' | 'archive';
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

export interface UnifiedAssetInsert {
  type: 'image' | 'video' | 'document' | 'embed' | 'archive';
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

// Unified hook that works with the consolidated media_assets table
export const useUnifiedAssets = (options?: {
  templatesOnly?: boolean;
  mediaOnly?: boolean;
  type?: string;
}) => {
  return useQuery({
    queryKey: ['unified-assets', options],
    queryFn: async () => {
      let query = supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters based on options
      if (options?.templatesOnly) {
        query = query.eq('is_template', true);
      }
      if (options?.mediaOnly) {
        query = query.eq('is_template', false);
      }
      if (options?.type) {
        query = query.eq('type', options.type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as UnifiedAsset[];
    }
  });
};

export const useUnifiedAssetMutations = () => {
  const queryClient = useQueryClient();

  const createAsset = useMutation({
    mutationFn: async (asset: UnifiedAssetInsert) => {
      const { data, error } = await supabase
        .from('media_assets')
        .insert({
          ...asset,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UnifiedAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-assets'] });
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success("Asset created successfully");
    },
    onError: (error) => {
      console.error('Error creating asset:', error);
      toast.error("Failed to create asset");
    }
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedAssetInsert> }) => {
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
      return data as UnifiedAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-assets'] });
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success("Asset updated successfully");
    },
    onError: (error) => {
      console.error('Error updating asset:', error);
      toast.error("Failed to update asset");
    }
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-assets'] });
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success("Asset deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting asset:', error);
      toast.error("Failed to delete asset");
    }
  });

  return {
    createAsset,
    updateAsset,
    deleteAsset
  };
};

// Hook for managing knowledge item asset associations (unified)
export const useKnowledgeItemUnifiedAssets = (knowledgeItemId?: string) => {
  return useQuery({
    queryKey: ['knowledge-item-unified-assets', knowledgeItemId],
    queryFn: async () => {
      if (!knowledgeItemId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_items_media')
        .select(`
          position,
          media_asset_id,
          media_assets (*)
        `)
        .eq('knowledge_item_id', knowledgeItemId)
        .order('position');
      
      if (error) throw error;
      
      return data
        .filter(item => item.media_assets)
        .map(item => {
          const asset = item.media_assets as any;
          return {
            ...asset,
            position: item.position
          } as UnifiedAsset & { position: number };
        });
    },
    enabled: !!knowledgeItemId
  });
};

export const useKnowledgeItemUnifiedAssetMutations = () => {
  const queryClient = useQueryClient();

  const updateKnowledgeItemAssets = useMutation({
    mutationFn: async ({ 
      knowledgeItemId, 
      assetIds 
    }: { 
      knowledgeItemId: string; 
      assetIds: string[] 
    }) => {
      // First, delete existing associations
      await supabase
        .from('knowledge_items_media')
        .delete()
        .eq('knowledge_item_id', knowledgeItemId);

      // Then insert new associations
      if (assetIds.length > 0) {
        const associations = assetIds.map((assetId, index) => ({
          knowledge_item_id: knowledgeItemId,
          media_asset_id: assetId,
          position: index
        }));

        const { error } = await supabase
          .from('knowledge_items_media')
          .insert(associations);

        if (error) throw error;
      }

      return { knowledgeItemId, assetIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-unified-assets', data.knowledgeItemId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-assets', data.knowledgeItemId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-media', data.knowledgeItemId] 
      });
      toast.success("Knowledge item assets updated successfully");
    },
    onError: (error) => {
      console.error('Error updating knowledge item assets:', error);
      toast.error("Failed to update knowledge item assets");
    }
  });

  return {
    updateKnowledgeItemAssets
  };
};

// Utility function to get templates (for backward compatibility)
export const useTemplates = () => {
  return useUnifiedAssets({ templatesOnly: true });
};

// Utility function to get media assets (for backward compatibility) 
export const useMediaAssets = () => {
  return useUnifiedAssets({ mediaOnly: true });
};