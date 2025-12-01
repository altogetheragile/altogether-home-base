import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectArtifact, useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Save } from 'lucide-react';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';
import { toast } from 'sonner';

export default function ArtifactViewer() {
  const { projectId, artifactId } = useParams();
  const navigate = useNavigate();
  const { data: artifact, isLoading: isLoadingArtifact } = useProjectArtifact(artifactId);
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { updateArtifact } = useProjectArtifactMutations();
  const bmcRef = useRef<BusinessModelCanvasRef>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const handleBMCDataChange = (newData: any) => {
    setEditedData(newData);
  };

  const handleStartEdit = () => {
    const originalBmcData = artifact?.data?.bmcData || artifact?.data;
    setEditedData(originalBmcData);
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!artifact || !editedData) return;
    
    try {
      const updatedArtifactData = {
        ...artifact.data,
        bmcData: editedData,
      };
      
      await updateArtifact.mutateAsync({
        id: artifact.id,
        updates: { data: updatedArtifactData }
      });
      
      toast.success('Changes saved successfully');
      setIsEditing(false);
      setEditedData(null);
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Error saving artifact:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(null);
  };

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
        // Extract bmcData from the saved artifact structure
        const originalBmcData = artifact.data?.bmcData || artifact.data;
        // Use editedData if available (during editing), otherwise use original
        const bmcData = editedData || originalBmcData;
        return (
          <div className="max-w-7xl mx-auto">
            <BusinessModelCanvas
              ref={bmcRef}
              data={bmcData}
              companyName={artifact.name}
              isEditable={isEditing}
              showWatermark={false}
              onDataChange={handleBMCDataChange}
            />
          </div>
        );
      case 'project-model':
        // Dynamically import and render the Project Modelling Canvas
        const ProjectModellingCanvas = React.lazy(() => 
          import('@/components/canvas/ProjectModellingCanvas').then(m => ({ default: m.ProjectModellingCanvas }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading canvas...</div>}>
            <ProjectModellingCanvas 
              initialData={artifact.data}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
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
              <div className="flex gap-2">
                {artifact.artifact_type === 'bmc' && !isEditing && (
                  <Button variant="outline" onClick={handleStartEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                )}
                {artifact.artifact_type === 'bmc' && !isEditing && (
                  <BMCExportDialog
                    canvasRef={bmcRef}
                    companyName={artifact.name}
                  />
                )}
              </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {renderArtifactContent()}
      </div>
    </div>
  );
}
