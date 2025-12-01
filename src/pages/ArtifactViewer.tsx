import { useParams, useNavigate } from 'react-router-dom';
import { useProjectArtifact } from '@/hooks/useProjectArtifacts';
import { useProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import { useRef } from 'react';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';

export default function ArtifactViewer() {
  const { projectId, artifactId } = useParams();
  const navigate = useNavigate();
  const { data: artifact, isLoading: isLoadingArtifact } = useProjectArtifact(artifactId);
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const bmcRef = useRef<BusinessModelCanvasRef>(null);

  if (isLoadingArtifact || isLoadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!artifact || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Artifact not found</h1>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const renderArtifactContent = () => {
    switch (artifact.artifact_type) {
      case 'bmc':
        return (
          <div className="max-w-7xl mx-auto">
            <BusinessModelCanvas
              ref={bmcRef}
              data={artifact.data}
              companyName={artifact.name}
              isEditable={false}
              showWatermark={false}
            />
          </div>
        );
      case 'canvas':
      case 'user_story':
        return (
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">
              Viewer for {artifact.artifact_type} artifacts coming soon...
            </p>
            <pre className="mt-4 p-4 bg-background rounded text-xs overflow-auto">
              {JSON.stringify(artifact.data, null, 2)}
            </pre>
          </div>
        );
      default:
        return (
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">Unknown artifact type</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{artifact.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.name}
                </p>
              </div>
            </div>
            {artifact.artifact_type === 'bmc' && (
              <BMCExportDialog
                canvasRef={bmcRef}
                companyName={artifact.name}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {renderArtifactContent()}
      </div>
    </div>
  );
}
