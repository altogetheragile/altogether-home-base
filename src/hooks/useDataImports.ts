import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DataImport {
  id: string;
  filename: string;
  file_type: 'excel' | 'csv' | 'json';
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'cancelled';
  target_entity: 'knowledge_items' | 'events' | 'instructors' | 'categories' | 'tags' | 'learning_paths';
  created_by?: string;
  created_at: string;
  processed_at?: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  mapping_config: Record<string, any>;
  processing_log: Array<any>;
  file_size?: number;
  original_filename?: string;
}

export interface StagingData {
  id: string;
  import_id: string;
  row_number: number;
  raw_data: Record<string, any>;
  mapped_data?: Record<string, any>;
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: Array<any>;
  processing_status: 'pending' | 'processed' | 'failed' | 'skipped';
  processing_errors: Array<any>;
  target_record_id?: string;
  created_at: string;
  processed_at?: string;
}

export const useDataImports = () => {
  return useQuery({
    queryKey: ['data_imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DataImport[];
    },
  });
};

export const useDataImport = (importId: string) => {
  return useQuery({
    queryKey: ['data_import', importId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .eq('id', importId)
        .single();
      
      if (error) throw error;
      return data as DataImport;
    },
    enabled: !!importId,
  });
};

export const useStagingData = (importId: string, limit = 100) => {
  return useQuery({
    queryKey: ['staging_data', importId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staging_data')
        .select('*')
        .eq('import_id', importId)
        .order('row_number')
        .limit(limit);
      
      if (error) throw error;
      return data as StagingData[];
    },
    enabled: !!importId,
  });
};

export const useCreateDataImport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (importData: Partial<DataImport>) => {
      const { data, error } = await supabase
        .from('data_imports')
        .insert([importData])
        .select()
        .single();
      
      if (error) throw error;
      return data as DataImport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data_imports'] });
      toast({
        title: 'Import Created',
        description: 'Data import session has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create import: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDataImport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DataImport> }) => {
      const { data, error } = await supabase
        .from('data_imports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DataImport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data_imports'] });
      toast({
        title: 'Import Updated',
        description: 'Import status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update import: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteDataImport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from('data_imports')
        .delete()
        .eq('id', importId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data_imports'] });
      toast({
        title: 'Import Deleted',
        description: 'Data import has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete import: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateStagingData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stagingRows: Partial<StagingData>[]) => {
      const { data, error } = await supabase
        .from('staging_data')
        .insert(stagingRows)
        .select();
      
      if (error) throw error;
      return data as StagingData[];
    },
    onSuccess: (_, variables) => {
      const importId = variables[0]?.import_id;
      if (importId) {
        queryClient.invalidateQueries({ queryKey: ['staging_data', importId] });
        queryClient.invalidateQueries({ queryKey: ['data_import', importId] });
      }
    },
  });
};