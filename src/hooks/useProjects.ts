import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color_theme: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  color_theme?: string;
}

export interface ProjectUpdate {
  id: string;
  name?: string;
  description?: string;
  color_theme?: string;
  is_archived?: boolean;
}

export interface ProjectStats {
  id: string;
  user_stories_count: number;
  epics_count: number;
  features_count: number;
  bmcs_count: number;
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
};

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async () => {
      // Get counts for all project artifacts
      const [
        { count: userStoriesCount },
        { count: epicsCount },
        { count: featuresCount }
      ] = await Promise.all([
        supabase.from('user_stories').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('epics').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('features').select('*', { count: 'exact', head: true }).eq('project_id', projectId)
      ]);

      return {
        id: projectId,
        user_stories_count: userStoriesCount || 0,
        epics_count: epicsCount || 0,
        features_count: featuresCount || 0,
        bmcs_count: 0, // TODO: Add BMC count when BMC table is created
      } as ProjectStats;
    },
    enabled: !!projectId,
  });
};

export const useProjectMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProject = useMutation({
    mutationFn: async (data: ProjectCreate) => {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          name: data.name,
          description: data.description,
          color_theme: data.color_theme || '#3B82F6',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: ProjectUpdate) => {
      const { id, ...updateData } = data;
      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return project as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const archiveProject = useMutation({
    mutationFn: async (id: string) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project archived",
        description: "Your project has been archived successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to archive project",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  return {
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
  };
};