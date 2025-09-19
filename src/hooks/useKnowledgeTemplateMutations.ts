import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeTemplateFormData } from '@/types/template';

export const useKnowledgeTemplateMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: async (data: KnowledgeTemplateFormData & { version?: string; replaceExisting?: boolean; existingId?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Extract control fields
      const { replaceExisting, existingId, version, ...templateData } = data;
      
      // If replacing existing template
      if (replaceExisting && existingId) {
        // Ensure pdf_file_size is an integer
        const cleanTemplateData = {
          ...templateData,
          pdf_file_size: templateData.pdf_file_size ? Math.round(Number(templateData.pdf_file_size)) : null
        };
        
        const { error } = await supabase
          .from('knowledge_templates')
          .update({
            ...cleanTemplateData,
            updated_by: user.id,
            version: version || '1.0'
          })
          .eq('id', existingId);

        if (error) {
          console.error('❌ Database update error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Failed to update template: ${error.message}`);
        }
        return { id: existingId };
      }
      
      // Creating new template
      const newId = crypto.randomUUID();
      
      // Ensure pdf_file_size is an integer
      const cleanTemplateData = {
        ...templateData,
        pdf_file_size: templateData.pdf_file_size ? Math.round(Number(templateData.pdf_file_size)) : null
      };
      
      const { error } = await supabase
        .from('knowledge_templates')
        .insert({
          id: newId,
          ...cleanTemplateData,
          created_by: user.id,
          updated_by: user.id,
          version: version || '1.0'
        });

      if (error) {
        console.error('❌ Database insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide user-friendly error messages
        if (error.code === '23505' && error.message.includes('unique_template_title_version')) {
          throw new Error(`A template with title "${templateData.title}" and version "${version || '1.0'}" already exists. Please choose a different version number.`);
        }
        
        throw new Error(`Database error: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
      }
      return { id: newId } as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KnowledgeTemplateFormData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: template, error } = await supabase
        .from('knowledge_templates')
        .update({
          ...data,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};