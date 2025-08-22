import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { ProjectCanvas as ProjectCanvasComponent } from '@/components/canvas/ProjectCanvas';

export default function ProjectCanvas() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(projectId!);

  // Show loading state while checking authentication
  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard if project not found
  if (!project) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ProjectCanvasComponent 
      projectId={projectId!} 
      projectName={project.name}
    />
  );
}