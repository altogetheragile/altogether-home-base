import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import LogoFull from '@/components/LogoFull';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useProjectArtifacts } from '@/hooks/useProjectArtifacts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wrench } from 'lucide-react';
import { getToolVisual } from '@/config/toolIcons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArtifactsList } from '@/components/projects/ArtifactsList';
import { ProjectJourney } from '@/components/pipeline/ProjectJourney';
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
              <Link to="/" aria-label="Altogether Agile home" className="flex-shrink-0">
                <LogoFull height={32} />
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
                  <Wrench className="h-4 w-4 mr-2" />
                  Project Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[
                  { label: 'Coaching Studio', route: '/coach', typeKey: 'coaching-session' },
                  { label: 'Business Model Canvas', route: '/bmc-generator', typeKey: 'bmc' },
                  { label: 'User Story Canvas', route: '/user-story-canvas', typeKey: 'user_story' },
                  { label: 'Project Model', route: '/project-modelling', typeKey: 'project-model' },
                  { label: 'Impact Map', route: '/impact-map', typeKey: 'impact-map' },
                  { label: 'Persona', route: '/personas', typeKey: 'persona' },
                  { label: 'Canvas', route: '/canvases', typeKey: 'canvas' },
                  { label: 'Probe Tracker', route: '/probes', typeKey: 'probe-tracker' },
                  { label: 'Benefits Scorecard', route: '/benefits', typeKey: 'benefits-scorecard' },
                  { label: 'Ways of Working', route: '/ways-of-working', typeKey: 'ways-of-working' },
                  { label: 'Product Backlog', route: '/backlog', typeKey: 'product-backlog' },
                ].map(({ label, route, typeKey }) => {
                  const { icon: Icon, color } = getToolVisual(typeKey);
                  return (
                    <DropdownMenuItem key={route} onClick={() => navigate(`${route}?projectId=${projectId}`)}>
                      <Icon className="h-4 w-4 mr-2" style={{ color }} />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
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
          <>
            <ProjectJourney artifacts={artifacts || []} projectId={projectId!} />
            <ArtifactsList
              artifacts={artifacts || []}
              projectId={projectId!}
            />
          </>
        )}
      </div>
    </div>
  );
}
