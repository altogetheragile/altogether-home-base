import React from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useProjectArtifacts } from '@/hooks/useProjectArtifacts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Sparkles, FileText, Hexagon, ClipboardList } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArtifactsList } from '@/components/projects/ArtifactsList';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: artifacts, isLoading: artifactsLoading } = useProjectArtifacts(projectId);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
                AltogetherAgile
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard?tab=projects')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color_theme }}
                />
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Artifact
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/bmc-generator?projectId=${projectId}`)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Business Model Canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/user-story-canvas?projectId=${projectId}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  User Story Canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/project-modelling?projectId=${projectId}`)}>
                  <Hexagon className="h-4 w-4 mr-2" />
                  Project Model
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/backlog?projectId=${projectId}`)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Product Backlog
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {artifactsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ArtifactsList 
            artifacts={artifacts || []} 
            projectId={projectId!}
          />
        )}
      </div>
    </div>
  );
}
