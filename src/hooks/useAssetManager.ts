import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Asset {
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
}

export interface AssetInsert {
  type: 'image' | 'video' | 'document' | 'embed' | 'template' | 'text' | 'archive';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  original_filename?: string;
}

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Asset[];
    }
  });
};

export const useAssetMutations = () => {
  const queryClient = useQueryClient();

  const createAsset = useMutation({
    mutationFn: async (asset: AssetInsert) => {
      const { data, error } = await supabase
        .from('media_assets')
        .insert({
          ...asset,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: "Success",
        description: "Asset created successfully"
      });
    },
    onError: (error) => {
      console.error('Error creating asset:', error);
      toast({
        title: "Error",
        description: "Failed to create asset",
        variant: "destructive"
      });
    }
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AssetInsert> }) => {
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
      return data as Asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: "Success",
        description: "Asset updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: "Failed to update asset",
        variant: "destructive"
      });
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
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: "Success",
        description: "Asset deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive"
      });
    }
  });

  return {
    createAsset,
    updateAsset,
    deleteAsset
  };
};

// Hook for managing knowledge item asset associations
export const useKnowledgeItemAssets = (knowledgeItemId?: string) => {
  return useQuery({
    queryKey: ['knowledge-item-assets', knowledgeItemId],
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
            updated_by
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
            position: item.position
          } as Asset & { position: number };
        });
    },
    enabled: !!knowledgeItemId
  });
};

export const useKnowledgeItemAssetMutations = () => {
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
        queryKey: ['knowledge-item-assets', data.knowledgeItemId] 
      });
      toast({
        title: "Success",
        description: "Knowledge item assets updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating knowledge item assets:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge item assets",
        variant: "destructive"
      });
    }
  });

  return {
    updateKnowledgeItemAssets
  };
};