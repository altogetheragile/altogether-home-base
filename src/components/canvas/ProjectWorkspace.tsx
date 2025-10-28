import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { TechniqueTabNavigation } from './TechniqueTabNavigation';
import { ProjectCanvas as ProjectCanvasComponent } from './ProjectCanvas';
import UserStoryCanvas from './UserStoryCanvas';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';
import { useCanvas, useCanvasMutations } from '@/hooks/useCanvas';
import { getTabsFromElements, getBMCElementFromCanvas } from '@/utils/techniqueMapping';
import { BMCData } from '@/components/canvas/templates/BMCCanvas';
import { toast } from 'sonner';

interface ProjectWorkspaceProps {
  projectId: string;
  projectName: string;
}

export const ProjectWorkspace = ({ projectId, projectName }: ProjectWorkspaceProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'canvas';
  const { data: canvas, isLoading: canvasLoading } = useCanvas(projectId);
  const { updateCanvas } = useCanvasMutations();
  const [bmcData, setBmcData] = useState<BMCData | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<BusinessModelCanvasRef>(null);

  // Detect available tabs from canvas elements
  const availableTabs = canvas?.data?.elements ? getTabsFromElements(canvas.data.elements) : [];

  // Extract BMC data from canvas
  useEffect(() => {
    if (canvas?.data?.elements) {
      const bmcElement = getBMCElementFromCanvas(canvas.data.elements);
      if (bmcElement?.content?.bmcData) {
        setBmcData(bmcElement.content.bmcData);
      }
    }
  }, [canvas]);

  const handleTabChange = (tabKey: string) => {
    setSearchParams({ tab: tabKey });
  };

  const handleBMCDataChange = (newData: BMCData) => {
    setBmcData(newData);
  };

  const handleSaveBMC = async () => {
    if (!projectId || !bmcData || !canvas) return;

    setIsSaving(true);
    try {
      const updatedElements = canvas.data.elements.map((el: any) => {
        if (el.type === 'bmc') {
          return {
            ...el,
            content: {
              ...el.content,
              bmcData: bmcData,
            },
          };
        }
        return el;
      });

      await updateCanvas.mutateAsync({
        projectId,
        data: {
          ...canvas.data,
          elements: updatedElements,
        },
      });

      toast.success('BMC saved successfully!');
    } catch (error) {
      console.error('Error saving BMC:', error);
      toast.error('Failed to save BMC');
    } finally {
      setIsSaving(false);
    }
  };

  if (canvasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold">{projectName}</h1>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'bmc' && (
                <>
                  <Button
                    onClick={handleSaveBMC}
                    disabled={isSaving}
                    variant="default"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <BMCExportDialog canvasRef={canvasRef} companyName={projectName} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TechniqueTabNavigation
        tabs={availableTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'canvas' && (
          <ProjectCanvasComponent projectId={projectId} projectName={projectName} />
        )}

        {activeTab === 'bmc' && (
          <div className="container max-w-7xl mx-auto px-4 py-8">
            {bmcData ? (
              <BusinessModelCanvas
                ref={canvasRef}
                data={bmcData}
                companyName={projectName}
                isEditable={true}
                onDataChange={handleBMCDataChange}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-muted-foreground">
                  No BMC data found. Add a BMC hexi to the canvas first.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'backlog' && (
          <div className="h-full">
            <UserStoryCanvas projectName={projectName} />
          </div>
        )}
      </div>
    </div>
  );
};
