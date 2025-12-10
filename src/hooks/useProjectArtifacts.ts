import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectArtifact {
  id: string;
  project_id: string;
  artifact_type: string;
  name: string;
  description: string | null;
  data: any;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  display_order: number;
}

export interface ProjectArtifactCreate {
  project_id: string;
  artifact_type: string;
  name: string;
  description?: string;
  data: any;
}

export interface ProjectArtifactUpdate {
  name?: string;
  description?: string;
  data?: any;
  project_id?: string;
  display_order?: number;
}

export const useProjectArtifacts = (projectId?: string) => {
  return useQuery({
    queryKey: ["project-artifacts", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_artifacts")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProjectArtifact[];
    },
    enabled: !!projectId,
  });
};

export const useProjectArtifact = (artifactId?: string) => {
  return useQuery({
    queryKey: ["project-artifact", artifactId],
    queryFn: async () => {
      if (!artifactId) return null;
      
      const { data, error } = await supabase
        .from("project_artifacts")
        .select("*")
        .eq("id", artifactId)
        .maybeSingle();

      if (error) throw error;
      return data as ProjectArtifact | null;
    },
    enabled: !!artifactId,
  });
};

export const useProjectArtifactMutations = () => {
  const queryClient = useQueryClient();

  const createArtifact = useMutation({
    mutationFn: async (artifact: ProjectArtifactCreate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get the max display_order for this type in the project
      const { data: existingArtifacts } = await supabase
        .from("project_artifacts")
        .select("display_order")
        .eq("project_id", artifact.project_id)
        .eq("artifact_type", artifact.artifact_type)
        .order("display_order", { ascending: false })
        .limit(1);

      const nextOrder = existingArtifacts && existingArtifacts.length > 0 
        ? (existingArtifacts[0].display_order || 0) + 1 
        : 1;

      const { data, error } = await supabase
        .from("project_artifacts")
        .insert({
          ...artifact,
          created_by: user.id,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectArtifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-artifacts", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Saved to project successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to save to project: " + error.message);
    },
  });

  const updateArtifact = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProjectArtifactUpdate }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("project_artifacts")
        .update({
          ...updates,
          updated_by: user.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectArtifact;
    },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["project-artifacts", data.project_id] });
    queryClient.invalidateQueries({ queryKey: ["project-artifact", data.id] });
    toast.success("Artifact updated successfully");
  },
    onError: (error: Error) => {
      toast.error("Failed to update artifact: " + error.message);
    },
  });

  const deleteArtifact = useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_artifacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-artifacts", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Artifact deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete artifact: " + error.message);
    },
  });

  const moveArtifact = useMutation({
    mutationFn: async ({ id, fromProjectId, toProjectId }: { id: string; fromProjectId: string; toProjectId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("project_artifacts")
        .update({ project_id: toProjectId, updated_by: user.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { artifact: data as ProjectArtifact, fromProjectId, toProjectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-artifacts", data.fromProjectId] });
      queryClient.invalidateQueries({ queryKey: ["project-artifacts", data.toProjectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Artifact moved successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to move artifact: " + error.message);
    },
  });

  const reorderArtifacts = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update each artifact's display_order
      for (const update of updates) {
        const { error } = await supabase
          .from("project_artifacts")
          .update({ display_order: update.display_order, updated_by: user.id })
          .eq("id", update.id);

        if (error) throw error;
      }
      
      return updates;
    },
    onError: (error: Error) => {
      toast.error("Failed to reorder artifacts: " + error.message);
    },
  });

  return {
    createArtifact,
    updateArtifact,
    deleteArtifact,
    moveArtifact,
    reorderArtifacts,
  };
};
