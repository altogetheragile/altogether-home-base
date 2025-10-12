import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useCanvas, useCanvasMutations } from '@/hooks/useCanvas';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Download } from 'lucide-react';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import { BMCData } from '@/components/canvas/templates/BMCCanvas';
import { toast } from 'sonner';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';

const ProjectBMC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: canvas, isLoading: canvasLoading } = useCanvas(projectId!);
  const { updateCanvas } = useCanvasMutations();
  const [bmcData, setBmcData] = useState<BMCData | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<BusinessModelCanvasRef>(null);

  // Extract BMC data from canvas elements
  useEffect(() => {
    if (canvas?.data?.elements) {
      // Find the BMC element in the canvas
      const bmcElement = canvas.data.elements.find((el: any) => 
        el.type === 'bmc'
      );
      
      if (bmcElement?.content?.bmcData) {
        setBmcData(bmcElement.content.bmcData);
      }
    }
  }, [canvas]);

  const handleDataChange = (newData: BMCData) => {
    setBmcData(newData);
  };

  const handleSave = async () => {
    if (!projectId || !bmcData || !canvas) return;
    
    setIsSaving(true);
    try {
      // Update the canvas with new BMC data
      const updatedElements = canvas.data.elements.map((el: any) => {
        if (el.type === 'bmc') {
          return {
            ...el,
            content: {
              ...el.content,
              bmcData: bmcData
            }
          };
        }
        return el;
      });

      await updateCanvas.mutateAsync({
        projectId,
        data: {
          ...canvas.data,
          elements: updatedElements
        }
      });

      toast.success('BMC saved successfully!');
    } catch (error) {
      console.error('Error saving BMC:', error);
      toast.error('Failed to save BMC');
    } finally {
      setIsSaving(false);
    }
  };

  if (projectLoading || canvasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-muted-foreground">Project not found</div>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const companyName = project.name || 'Business Model Canvas';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard?tab=projects')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold">{companyName}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="default"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <BMCExportDialog 
                canvasRef={canvasRef}
                companyName={companyName}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BMC Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {bmcData ? (
          <BusinessModelCanvas
            ref={canvasRef}
            data={bmcData}
            companyName={companyName}
            isEditable={true}
            onDataChange={handleDataChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-muted-foreground">No BMC data found for this project</div>
            <Button onClick={() => navigate('/bmc-generator')}>
              Create New BMC
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBMC;
