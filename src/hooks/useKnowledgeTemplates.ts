import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeTemplate, KnowledgeTemplateFormData } from '@/types/template';

export const useKnowledgeTemplates = () => {
  return useQuery({
    queryKey: ['knowledge-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeTemplate[];
    },
  });
};

export const useKnowledgeTemplate = (id?: string) => {
  return useQuery({
    queryKey: ['knowledge-template', id],
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      
      const { data, error } = await supabase
        .from('knowledge_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as KnowledgeTemplate | null;
    },
    enabled: !!id,
  });
};

export const useCreateKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: KnowledgeTemplateFormData) => {
      const { data: template, error } = await supabase
        .from('knowledge_templates')
        .insert([{
          title: data.title,
          description: data.description,
          template_type: data.template_type,
          category: data.category,
          version: data.version || '1.0',
          is_public: data.is_public,
          pdf_url: data.pdf_url,
          pdf_filename: data.pdf_filename,
          pdf_file_size: data.pdf_file_size,
          pdf_page_count: data.pdf_page_count,
          thumbnail_url: data.thumbnail_url,
          tags: data.tags,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('unique_template_title_version')) {
          throw new Error(`A template with title "${data.title}" and version "${data.version || '1.0'}" already exists. Please choose a different version number.`);
        }
        throw error;
      }
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KnowledgeTemplate> }) => {
      const updateData: any = {
        updated_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      // Only include valid database columns
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.template_type !== undefined) updateData.template_type = data.template_type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.version !== undefined) updateData.version = data.version;
      if (data.is_public !== undefined) updateData.is_public = data.is_public;
      if (data.pdf_url !== undefined) updateData.pdf_url = data.pdf_url;
      if (data.pdf_filename !== undefined) updateData.pdf_filename = data.pdf_filename;
      if (data.pdf_file_size !== undefined) updateData.pdf_file_size = data.pdf_file_size;
      if (data.pdf_page_count !== undefined) updateData.pdf_page_count = data.pdf_page_count;
      if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url;
      if (data.tags !== undefined) updateData.tags = data.tags;

      const { data: template, error } = await supabase
        .from('knowledge_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('unique_template_title_version')) {
          throw new Error(`A template with title "${data.title}" and version "${data.version}" already exists. Please choose a different version number.`);
        }
        throw error;
      }
      return template;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-template', id] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });
};

// Hook for getting templates by type
export const useKnowledgeTemplatesByType = (templateType?: string) => {
  return useQuery({
    queryKey: ['knowledge-templates', 'type', templateType],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_templates')
        .select('*')
        .eq('is_public', true);

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return data as KnowledgeTemplate[];
    },
    enabled: templateType !== undefined,
  });
};