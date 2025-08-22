import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CanvasData } from '@/components/canvas/BaseCanvas';

export interface Canvas {
  id: string;
  project_id: string;
  data: CanvasData;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const useCanvas = (projectId: string) => {
  return useQuery({
    queryKey: ['canvas', projectId],
    queryFn: async () => {
      console.log('Fetching canvas for project:', projectId);
      
      const { data, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Get the most recent canvas if multiple exist

      if (error) {
        console.error('Error fetching canvas:', error);
        throw error;
      }
      
      if (data) {
        console.log('Canvas found:', data.id);
      } else {
        console.log('No canvas found for project');
      }
      
      return data as Canvas | null;
    },
    enabled: !!projectId,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a permissions error
      if (error?.code === 'PGRST301' || error?.code === '42501') {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCanvasMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCanvas = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: CanvasData }) => {
      const { data: canvas, error } = await supabase
        .from('canvases')
        .insert([{
          project_id: projectId,
          data,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return canvas as Canvas;
    },
    onSuccess: (canvas) => {
      queryClient.invalidateQueries({ queryKey: ['canvas', canvas.project_id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create canvas",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateCanvas = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: CanvasData }) => {
      const { data: canvas, error } = await supabase
        .from('canvases')
        .update({ data })
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) throw error;
      return canvas as Canvas;
    },
    onSuccess: (canvas) => {
      queryClient.invalidateQueries({ queryKey: ['canvas', canvas.project_id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update canvas",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  return {
    createCanvas,
    updateCanvas,
  };
};