import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityItem {
  id: string;
  type: 'project_created' | 'project_updated' | 'artifact_created' | 'artifact_updated' | 'event_registered';
  title: string;
  description?: string;
  timestamp: string;
  metadata: {
    projectId?: string;
    projectName?: string;
    artifactId?: string;
    artifactType?: string;
    eventId?: string;
  };
}

export const useRecentUserActivity = (limit: number = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-user-activity', user?.id, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user?.id) return [];

      const activities: ActivityItem[] = [];

      // Fetch recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, updated_at')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (projects) {
        projects.forEach(project => {
          const isNew = new Date(project.created_at).getTime() === new Date(project.updated_at).getTime();
          activities.push({
            id: `project-${project.id}-${isNew ? 'created' : 'updated'}`,
            type: isNew ? 'project_created' : 'project_updated',
            title: isNew ? `Created project "${project.name}"` : `Updated project "${project.name}"`,
            timestamp: isNew ? project.created_at : project.updated_at,
            metadata: {
              projectId: project.id,
              projectName: project.name,
            },
          });
        });
      }

      // Fetch recent artifacts
      const { data: artifacts } = await supabase
        .from('project_artifacts')
        .select('id, name, artifact_type, created_at, updated_at, project_id, projects(name)')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (artifacts) {
        artifacts.forEach(artifact => {
          const isNew = new Date(artifact.created_at).getTime() === new Date(artifact.updated_at).getTime();
          const projectName = (artifact.projects as any)?.name || 'Unknown project';
          activities.push({
            id: `artifact-${artifact.id}-${isNew ? 'created' : 'updated'}`,
            type: isNew ? 'artifact_created' : 'artifact_updated',
            title: isNew 
              ? `Created ${artifact.artifact_type} "${artifact.name}"`
              : `Updated ${artifact.artifact_type} "${artifact.name}"`,
            description: `in ${projectName}`,
            timestamp: isNew ? artifact.created_at : artifact.updated_at,
            metadata: {
              projectId: artifact.project_id,
              projectName,
              artifactId: artifact.id,
              artifactType: artifact.artifact_type,
            },
          });
        });
      }

      // Fetch recent event registrations
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('id, registered_at, event_id, events(id, title)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(limit);

      if (registrations) {
        registrations.forEach(reg => {
          const event = reg.events as any;
          if (event) {
            activities.push({
              id: `registration-${reg.id}`,
              type: 'event_registered',
              title: `Registered for "${event.title}"`,
              timestamp: reg.registered_at || new Date().toISOString(),
              metadata: {
                eventId: event.id,
              },
            });
          }
        });
      }

      // Sort all activities by timestamp (most recent first) and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    enabled: !!user?.id,
  });
};
