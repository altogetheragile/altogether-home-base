import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeTemplateFormData } from '@/types/template';
import type { Database } from '@/integrations/supabase/types';

// `LearningResource` carries a generic file_url / file_filename / file_size / file_page_count /
// file_format set alongside the pdf_* one it calls legacy. The database has it the other way round:
// only pdf_* exists, and an update carrying file_url is rejected outright - confirmed against the
// live table. Nothing writes them today, so nothing is broken, but spreading a caller's object into
// an insert means the next person to set one gets a failure with no obvious cause.
//
// So the columns are named here. Anything not on this list cannot reach the table.
const TEMPLATE_COLUMNS = [
  'title', 'description', 'template_type', 'category', 'is_public', 'usage_count',
  'thumbnail_url', 'tags', 'pdf_url', 'pdf_filename', 'pdf_file_size', 'pdf_page_count',
] as const;

type TemplateInsert = Database['public']['Tables']['knowledge_templates']['Insert'];

/** The writable columns of `knowledge_templates`, and nothing else. The cast asserts exactly what
 *  the loop above guarantees: every key came from TEMPLATE_COLUMNS. */
function templateRow(data: Record<string, unknown>): TemplateInsert {
  const row: Record<string, unknown> = {};
  for (const key of TEMPLATE_COLUMNS) if (key in data) row[key] = data[key];
  if (row.pdf_file_size != null) row.pdf_file_size = Math.round(Number(row.pdf_file_size));
  else if ('pdf_file_size' in data) row.pdf_file_size = null;
  return row as TemplateInsert;
}

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
        const { error } = await supabase
          .from('knowledge_templates')
          .update({
            ...templateRow(templateData as Record<string, unknown>),
            updated_by: user.id,
            version: version || '1.0'
          })
          .eq('id', existingId);

        if (error) {
          throw new Error(`Failed to update template: ${error.message}`);
        }
        return { id: existingId };
      }
      
      // Creating new template
      const newId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('knowledge_templates')
        .insert({
          id: newId,
          ...templateRow(templateData as Record<string, unknown>),
          created_by: user.id,
          updated_by: user.id,
          version: version || '1.0'
        });

      if (error) {
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
          ...templateRow(data as Record<string, unknown>),
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Provide user-friendly error messages
        if (error.code === '23505' && error.message.includes('unique_template_title_version')) {
          throw new Error(`A template with title "${data.title}" and this version already exists. Please choose a different version number.`);
        }
        
        throw new Error(`Failed to update template: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
      }
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