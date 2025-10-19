import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CanvasData } from '@/components/canvas/BaseCanvas';

export interface Canvas {
  id: string;
  project_id: string | null;
  user_id: string | null;
  canvas_type: string;
  data: CanvasData;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const useCanvas = (projectId?: string, userId?: string, canvasType: string = 'project') => {
  const scopeId = projectId || userId;
  const scopeType = projectId ? 'project' : 'user';
  
  return useQuery({
    queryKey: ['canvas', scopeType, scopeId, canvasType],
    queryFn: async () => {
      console.log(`Fetching ${canvasType} canvas for ${scopeType}:`, scopeId);
      
      let query = supabase
        .from('canvases')
        .select('*')
        .eq('canvas_type', canvasType)
        .order('created_at', { ascending: false })
        .limit(1);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching canvas:', error);
        throw error;
      }
      
      if (data) {
        console.log('Canvas found:', data.id);
      } else {
        console.log(`No ${canvasType} canvas found for ${scopeType}`);
      }
      
      return data as Canvas | null;
    },
    enabled: !!scopeId,
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
    mutationFn: async ({ 
      projectId, 
      userId, 
      canvasType = 'project', 
      data 
    }: { 
      projectId?: string; 
      userId?: string; 
      canvasType?: string; 
      data: CanvasData 
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      
      const { data: canvas, error } = await supabase
        .from('canvases')
        .insert([{
          project_id: projectId || null,
          user_id: userId || null,
          canvas_type: canvasType,
          data,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return canvas as Canvas;
    },
    onSuccess: (canvas) => {
      const scopeType = canvas.project_id ? 'project' : 'user';
      const scopeId = canvas.project_id || canvas.user_id;
      queryClient.invalidateQueries({ queryKey: ['canvas', scopeType, scopeId, canvas.canvas_type] });
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
    mutationFn: async ({ 
      canvasId,
      projectId, 
      userId, 
      canvasType = 'project', 
      data 
    }: { 
      canvasId?: string;
      projectId?: string; 
      userId?: string; 
      canvasType?: string; 
      data: CanvasData 
    }) => {
      let query = supabase
        .from('canvases')
        .update({ data })
        .eq('canvas_type', canvasType);

      if (canvasId) {
        query = query.eq('id', canvasId);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: canvas, error } = await query.select().single();

      if (error) throw error;
      return canvas as Canvas;
    },
    onSuccess: (canvas) => {
      const scopeType = canvas.project_id ? 'project' : 'user';
      const scopeId = canvas.project_id || canvas.user_id;
      queryClient.invalidateQueries({ queryKey: ['canvas', scopeType, scopeId, canvas.canvas_type] });
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