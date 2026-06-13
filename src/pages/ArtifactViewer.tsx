import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import LogoFull from '@/components/LogoFull';
import { canvasByKey } from '@/config/canvases';
import { useProjectArtifact, useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useProject } from '@/hooks/useProjects';
import { useBacklogItems } from '@/hooks/useBacklogItems';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Save, Download, X } from 'lucide-react';
import { getToolVisual } from '@/config/toolIcons';
import { Separator } from '@/components/ui/separator';
import BusinessModelCanvas, { BusinessModelCanvasRef } from '@/components/bmc/BusinessModelCanvas';
import BMCExportDialog from '@/components/bmc/BMCExportDialog';
import { LocalBacklogList } from '@/components/backlog/LocalBacklogList';
import { LocalBacklogQuickAdd } from '@/components/backlog/LocalBacklogQuickAdd';
import { SchemeProvider } from '@/components/backlog/SchemeContext';
import { useProjectScheme } from '@/hooks/useProjectScheme';
import { LocalBacklogItem, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

export default function ArtifactViewer() {
  const { projectId, artifactId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('from');
  const { data: artifact, isLoading: isLoadingArtifact } = useProjectArtifact(artifactId || '');
  const { data: project, isLoading: isLoadingProject } = useProject(projectId || '');
  const { data: liveBacklogItems } = useBacklogItems(projectId);
  const { scheme: backlogScheme } = useProjectScheme(projectId);
  const { updateArtifact } = useProjectArtifactMutations();
  const bmcRef = useRef<BusinessModelCanvasRef>(null);
  
  // BMC editing state
  const [isEditingBMC, setIsEditingBMC] = useState(false);
  const [editedBMCData, setEditedBMCData] = useState<any>(null);
  
  // Backlog editing state
  const [isEditingBacklog, setIsEditingBacklog] = useState(false);
  const [editedBacklogItems, setEditedBacklogItems] = useState<LocalBacklogItem[]>([]);

  // BMC handlers
  const handleBMCDataChange = (newData: any) => {
    setEditedBMCData(newData);
  };

  const handleStartEditBMC = () => {
    const originalBmcData = artifact?.data?.bmcData || artifact?.data;
    setEditedBMCData(originalBmcData);
    setIsEditingBMC(true);
  };

  const handleSaveBMCChanges = async () => {
    if (!artifact || !editedBMCData) return;
    
    try {
      const updatedArtifactData = {
        ...artifact.data,
        bmcData: editedBMCData,
      };
      
      await updateArtifact.mutateAsync({
        id: artifact.id,
        updates: { data: updatedArtifactData }
      });
      
      toast.success('Changes saved successfully');
      setIsEditingBMC(false);
      setEditedBMCData(null);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEditBMC = () => {
    setIsEditingBMC(false);
    setEditedBMCData(null);
  };

  // Backlog handlers
  const handleSaveBacklogChanges = async () => {
    if (!artifact) return;
    
    try {
      const updatedArtifactData = {
        ...artifact.data,
        items: editedBacklogItems,
      };
      
      await updateArtifact.mutateAsync({
        id: artifact.id,
        updates: { data: updatedArtifactData }
      });
      
      toast.success('Backlog saved successfully');
      setIsEditingBacklog(false);
      setEditedBacklogItems([]);
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEditBacklog = () => {
    setIsEditingBacklog(false);
    setEditedBacklogItems([]);
  };

  const handleAddBacklogItem = (input: LocalBacklogItemInput) => {
    const newItem: LocalBacklogItem = {
      ...input,
      id: crypto.randomUUID(),
      backlog_position: editedBacklogItems.length,
    };
    setEditedBacklogItems(prev => [...prev, newItem]);
  };

  const handleUpdateBacklogItem = (id: string, updates: Partial<LocalBacklogItem>) => {
    setEditedBacklogItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteBacklogItem = (id: string) => {
    setEditedBacklogItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReorderBacklogItems = (updates: { id: string; backlog_position: number }[]) => {
    setEditedBacklogItems(prev => {
      const newItems = [...prev];
      updates.forEach(({ id, backlog_position }) => {
        const index = newItems.findIndex(item => item.id === id);
        if (index !== -1) {
          newItems[index] = { ...newItems[index], backlog_position };
        }
      });
      return newItems.sort((a, b) => a.backlog_position - b.backlog_position);
    });
  };

  const handleExportBacklog = () => {
    // Use live database items instead of artifact snapshot
    const items = liveBacklogItems || [];
    if (items.length === 0) {
      toast.error('No backlog items to export');
      return;
    }

    const exportData = items.map((item: any) => ({
      Title: item.title,
      Description: item.description || '',
      Priority: item.priority || '',
      Status: item.status || '',
      'Estimated Value': item.estimated_value || '',
      'Estimated Effort': item.estimated_effort || '',
      Source: item.source || '',
      'Target Release': item.target_release || '',
      Tags: item.tags?.join(', ') || '',
    }));

    exportToCSV(exportData, `${artifact?.name || 'product-backlog'}`);
    toast.success('Backlog exported successfully');
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
        const originalBmcData = artifact.data?.bmcData || artifact.data;
        const bmcData = editedBMCData || originalBmcData;
        return (
          <div className="max-w-7xl mx-auto">
            <BusinessModelCanvas
              ref={bmcRef}
              data={bmcData}
              companyName={artifact.name}
              isEditable={isEditingBMC}
              showWatermark={false}
              onDataChange={handleBMCDataChange}
            />
          </div>
        );
      case 'project-model':
        const ProjectModellingCanvas = React.lazy(() => 
          import('@/components/canvas/ProjectModellingCanvas').then(m => ({ default: m.ProjectModellingCanvas }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading canvas...</div>}>
            <ProjectModellingCanvas
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'product-backlog':
        if (isEditingBacklog) {
          return (
            <SchemeProvider scheme={backlogScheme}>
              <div className="max-w-4xl mx-auto space-y-6">
                <LocalBacklogQuickAdd onAddItem={handleAddBacklogItem} />
                <LocalBacklogList
                  items={editedBacklogItems}
                  onUpdateItem={handleUpdateBacklogItem}
                  onDeleteItem={handleDeleteBacklogItem}
                  onReorderItems={handleReorderBacklogItems}
                  isEditable={true}
                />
              </div>
            </SchemeProvider>
          );
        }
        // Use live database items instead of artifact snapshot
        const backlogItems: LocalBacklogItem[] = (liveBacklogItems || []).map((item: any, index: number) => ({
          id: item.id || crypto.randomUUID(),
          title: item.title,
          description: item.description || null,
          acceptance_criteria: item.acceptance_criteria || null,
          priority: item.priority || 'medium',
          status: item.status || 'idea',
          source: item.source || null,
          estimated_value: item.estimated_value || null,
          estimated_effort: item.estimated_effort || null,
          tags: item.tags || null,
          target_release: item.target_release || null,
          backlog_position: item.backlog_position ?? index,
          item_type: item.item_type || 'story',
          parent_item_id: item.parent_item_id || null,
          priority_data: item.priority_data ?? null,
        }));
        return (
          <SchemeProvider scheme={backlogScheme}>
            <div className="max-w-4xl mx-auto">
              <LocalBacklogList
                items={backlogItems}
                onUpdateItem={() => {}}
                onDeleteItem={() => {}}
                onReorderItems={() => {}}
                isEditable={false}
              />
            </div>
          </SchemeProvider>
        );
      case 'canvas':
      case 'user_story':
        const AIToolsCanvas = React.lazy(() => 
          import('@/components/canvas/AIToolsCanvas').then(m => ({ default: m.default }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading canvas...</div>}>
            <AIToolsCanvas
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'impact-map':
        const ImpactMapEditor = React.lazy(() =>
          import('@/components/impactMap/ImpactMapEditor').then(m => ({ default: m.ImpactMapEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading impact map...</div>}>
            <ImpactMapEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'persona':
        const PersonaEditor = React.lazy(() =>
          import('@/components/persona/PersonaEditor').then(m => ({ default: m.PersonaEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading persona...</div>}>
            <PersonaEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'journey-map':
        const JourneyMapEditor = React.lazy(() =>
          import('@/components/journeyMap/JourneyMapEditor').then(m => ({ default: m.JourneyMapEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading journey map...</div>}>
            <JourneyMapEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'ways-of-working':
        const WaysOfWorkingEditor = React.lazy(() =>
          import('@/components/waysOfWorking/WaysOfWorkingEditor').then(m => ({ default: m.WaysOfWorkingEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading ways of working...</div>}>
            <WaysOfWorkingEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'probe-tracker':
        const ProbeTrackerEditor = React.lazy(() =>
          import('@/components/probeTracker/ProbeTrackerEditor').then(m => ({ default: m.ProbeTrackerEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading probe tracker...</div>}>
            <ProbeTrackerEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'benefits-scorecard':
        const BenefitsScorecardEditor = React.lazy(() =>
          import('@/components/benefitsScorecard/BenefitsScorecardEditor').then(m => ({ default: m.BenefitsScorecardEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading benefits scorecard...</div>}>
            <BenefitsScorecardEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'coaching-session':
        const CoachingStudioEditor = React.lazy(() =>
          import('@/components/coachingStudio/CoachingStudioEditor').then(m => ({ default: m.CoachingStudioEditor }))
        );
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading coaching session...</div>}>
            <CoachingStudioEditor
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      case 'business-case':
      case 'product-vision': {
        const CoachedCanvasEditor = React.lazy(() =>
          import('@/components/canvases/CoachedCanvasEditor').then(m => ({ default: m.CoachedCanvasEditor }))
        );
        const def = canvasByKey(artifact.artifact_type);
        if (!def) return <div className="bg-muted p-8 rounded-lg"><p className="text-muted-foreground">Unknown canvas</p></div>;
        return (
          <React.Suspense fallback={<div className="flex justify-center p-8">Loading canvas...</div>}>
            <CoachedCanvasEditor
              def={def}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              initialData={artifact.data as any}
              artifactId={artifact.id}
              projectId={projectId}
            />
          </React.Suspense>
        );
      }
      default:
        return (
          <div className="bg-muted p-8 rounded-lg">
            <p className="text-muted-foreground">Unknown artifact type</p>
          </div>
        );
    }
  };

  const renderHeaderActions = () => {
    // BMC actions
    if (artifact.artifact_type === 'bmc') {
      if (isEditingBMC) {
        return (
          <>
            <Button variant="outline" onClick={handleCancelEditBMC}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveBMCChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        );
      }
      return (
        <>
          <Button variant="outline" onClick={handleStartEditBMC}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <BMCExportDialog
            canvasRef={bmcRef}
            companyName={artifact.name}
          />
        </>
      );
    }

    // Product backlog actions
    if (artifact.artifact_type === 'product-backlog') {
      if (isEditingBacklog) {
        return (
          <>
            <Button variant="outline" onClick={handleCancelEditBacklog}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveBacklogChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        );
      }
      return (
        <>
          <Button variant="outline" onClick={() => navigate(`/backlog?projectId=${projectId}`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit in Backlog
          </Button>
          <Button variant="outline" onClick={handleExportBacklog}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          {/* Top row: Logo and actions */}
          <div className="flex items-center justify-between mb-2">
            <Link to="/" aria-label="Altogether Agile home" className="flex-shrink-0">
              <LogoFull height={32} />
            </Link>
            <div className="flex gap-2">
              {renderHeaderActions()}
            </div>
          </div>
          {/* Bottom row: Back button and title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const sourceArtifactId = searchParams.get('sourceArtifactId');
                if (returnTo === 'project-model' && sourceArtifactId) {
                  navigate(`/projects/${projectId}/artifacts/${sourceArtifactId}`);
                } else {
                  navigate(`/projects/${projectId}`);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnTo === 'project-model' ? 'Back to Project Model' : 'Back to Project'}
            </Button>
            <Separator orientation="vertical" className="h-5" />
            {(() => {
              const { icon: Icon, color } = getToolVisual(artifact.artifact_type);
              return <Icon className="h-5 w-5 shrink-0" style={{ color }} />;
            })()}
            <h1 className="text-xl font-semibold">{artifact.name}</h1>
          </div>
        </div>
      </div>

      <div className={`container mx-auto px-4 ${['project-model', 'canvas', 'user_story'].includes(artifact.artifact_type) ? 'py-0' : 'py-8'}`}>
        {renderArtifactContent()}
      </div>
    </div>
  );
}
