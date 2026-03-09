import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Copy, Download, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from '@/hooks/useUserStories';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProjects } from '@/hooks/useProjects';
import { useCanvasMutations } from '@/hooks/useCanvas';
import { StoryAnalysisResults } from './StoryAnalysisResults';
import { StoryAdvancedOptions } from './StoryAdvancedOptions';
import {
  type StoryAnalysisResult,
  type AnalysisTextItem,
  formatForExport,
  downloadAsFile,
  getItemText,
} from './storyExportUtils';

interface CanvasData {
  elements?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    content: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

interface UserStoryClarifierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onStoryGenerated?: (storyData: {
    title: string;
    story: string;
    acceptanceCriteria: AnalysisTextItem[];
    priority: string;
    storyPoints: number;
    status: string;
  }) => void;
}

export function UserStoryClarifierDialog({ isOpen, onClose, projectId, onStoryGenerated }: UserStoryClarifierDialogProps) {
  const [storyType, setStoryType] = useState<'epic' | 'feature' | 'story'>('story');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [analysisType, setAnalysisType] = useState<'user-story-generation' | 'spidr' | 'split' | 'acceptance_criteria' | 'refine'>('user-story-generation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StoryAnalysisResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [saveToCanvas, setSaveToCanvas] = useState(false);

  const { toast } = useToast();
  const { createStory, createEpic, createFeature, createBulkStories } = useStoryMutations();
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const { updateCanvas } = useCanvasMutations();

  const handleAnalyze = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your story.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-canvas', {
        body: {
          canvasType: 'story-analysis',
          analysisType,
          storyType,
          title,
          description,
        },
      });

      if (error) {
        let errorMessage = "Failed to analyze story. Please try again.";

        if (error.message?.includes('Failed to send a request')) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else if (error.message?.includes('non-2xx status code')) {
          errorMessage = "AI service is temporarily unavailable. Please try again in a moment.";
        }

        toast({
          title: "Analysis failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.generatedCanvas) {
        toast({
          title: "No results",
          description: "The analysis didn't return any results. Please try rephrasing your story.",
          variant: "destructive",
        });
        return;
      }

      const result = data.generatedCanvas as StoryAnalysisResult;
      setAnalysisResult(result);

      // Auto-populate fields if we got a user story generation
      if (result.analysisType === 'user-story-generation' || analysisType === 'user-story-generation') {
        if (result.title) setTitle(result.title);
        if (result.description) setDescription(result.description);

        // If canvas integration is enabled, pass the data back immediately
        if (onStoryGenerated && result.title && result.description) {
          onStoryGenerated({
            title: result.title,
            story: result.description,
            acceptanceCriteria: result.acceptanceCriteria || [],
            priority: 'medium',
            storyPoints: 3,
            status: 'draft'
          });
          onClose();
          return;
        }
      }

      toast({
        title: "Analysis complete!",
        description: analysisType === 'user-story-generation' ?
          "Your user story has been generated!" :
          "Your story has been successfully analyzed.",
      });
    } catch (error) {
      let errorMessage = "An unexpected error occurred.";

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateStory = async (storyData?: {
    title: string;
    description: string;
    acceptanceCriteria: AnalysisTextItem[];
  }) => {
    const storyToCreate = storyData || {
      title,
      description,
      acceptanceCriteria: analysisResult?.acceptanceCriteria || [],
    };

    try {
      // Save to database if requested
      if (!saveToCanvas) {
        if (storyType === 'epic') {
          await createEpic.mutateAsync({
            title: storyToCreate.title,
            description: storyToCreate.description,
            status: 'draft',
          });
        } else {
          await createStory.mutateAsync({
            title: storyToCreate.title,
            description: storyToCreate.description,
            acceptance_criteria: storyToCreate.acceptanceCriteria.map(getItemText),
            status: 'draft',
            priority: 'medium',
            issue_type: storyType === 'feature' ? 'story' : storyType,
            story_points: storyType === 'story' ? 3 : undefined,
          });
        }
      }

      // Save to canvas if project is selected
      if (saveToCanvas && selectedProjectId) {
        await saveStoryToCanvas(storyToCreate);
      }

      if (!storyData) {
        handleReset();
        onClose();
      }
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  const saveStoryToCanvas = async (storyData: {
    title: string;
    description: string;
    acceptanceCriteria: AnalysisTextItem[];
  }) => {
    try {
      // Get existing canvas or create new one
      const { data: existingCanvas } = await supabase
        .from('canvases')
        .select('id, data')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newElement = {
        id: crypto.randomUUID(),
        type: 'story',
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        size: { width: 280, height: 160 },
        content: {
          title: storyData.title,
          story: storyData.description,
          priority: 'medium',
          storyPoints: 3,
          status: 'draft'
        },
      };

      const canvasData = existingCanvas?.data as CanvasData | null;
      const updatedData: CanvasData = existingCanvas
        ? {
            ...canvasData,
            elements: [...(canvasData?.elements || []), newElement]
          }
        : {
            elements: [newElement],
            metadata: {}
          };

      if (existingCanvas) {
        await updateCanvas.mutateAsync({
          projectId: selectedProjectId,
          data: updatedData as unknown as import('@/components/canvas/BaseCanvas').CanvasData,
        });
      } else {
        await supabase.from('canvases').insert({
          project_id: selectedProjectId,
          data: updatedData as unknown as import('@/integrations/supabase/types').Json,
        });
      }

      toast({
        title: "Story added to canvas",
        description: "Your story has been added to the project canvas.",
      });
    } catch (error) {
      toast({
        title: "Failed to save to canvas",
        description: "Could not add the story to the canvas.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setAnalysisResult(null);
    setAnalysisType('user-story-generation');
    setStoryType('story');
    setSaveToCanvas(false);
    if (!projectId) {
      setSelectedProjectId('');
    }
  };

  const handleCopyToClipboard = async (content?: string) => {
    const textToCopy = content || formatForExport(analysisResult, title, description);
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: 'json' | 'text') => {
    const content = format === 'json' ?
      JSON.stringify({ title, description, analysisResult }, null, 2) :
      formatForExport(analysisResult, title, description);

    const filename = `user-story-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    downloadAsFile(content, filename, mimeType);

    toast({
      title: "Export successful",
      description: `Content exported as ${format.toUpperCase()} file.`,
    });
  };

  const handleSignInRedirect = () => {
    window.open('/auth', '_blank');
  };

  const handleSaveAllSplitStories = async () => {
    if (!analysisResult?.splitStories || !user) return;

    try {
      let parentId: string | undefined;

      // Create parent first if needed
      if (storyType === 'epic') {
        const parentEpic = await createEpic.mutateAsync({
          title,
          description,
          status: 'draft',
        });
        parentId = parentEpic.id;
      } else if (storyType === 'feature') {
        const parentFeature = await createFeature.mutateAsync({
          title,
          description,
        });
        parentId = parentFeature.id;
      }

      // Create all split stories with parent relationship
      const storiesToCreate = analysisResult.splitStories.map(story => ({
        title: story.title,
        description: story.description,
        acceptance_criteria: story.acceptanceCriteria.map(getItemText),
        status: 'draft' as const,
        priority: 'medium' as const,
        issue_type: 'story' as const,
        story_points: 3,
        epic_id: storyType === 'epic' ? parentId : undefined,
        feature_id: storyType === 'feature' ? parentId : undefined,
      }));

      await createBulkStories.mutateAsync(storiesToCreate);

      toast({
        title: "Stories created successfully!",
        description: `Created ${storyType} "${title}" with ${storiesToCreate.length} child stories.`,
      });

      handleReset();
      onClose();
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  const isSavingStories = createStory.isPending || createEpic.isPending || createFeature.isPending || createBulkStories.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {analysisType === 'user-story-generation' ?
                'Generate User Story - Turn Ideas into Actionable Stories' :
                'Story Clarifier - Turn Ideas into User Stories'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!user && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI Analysis is free for everyone!</strong> You can generate user stories and get AI insights without signing in.
                  Sign in to save your stories and manage them in projects.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">What are you trying to build? *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Lean Eat meal delivery service"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Details (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional context, requirements, or ideas..."
                  rows={3}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm"
              >
                {showAdvanced ? '← Simple Mode' : '→ Advanced Options'}
              </Button>

              {showAdvanced && (
                <StoryAdvancedOptions
                  storyType={storyType}
                  onStoryTypeChange={setStoryType}
                  analysisType={analysisType}
                  onAnalysisTypeChange={setAnalysisType}
                  saveToCanvas={saveToCanvas}
                  onSaveToCanvasChange={setSaveToCanvas}
                  selectedProjectId={selectedProjectId}
                  onSelectedProjectIdChange={setSelectedProjectId}
                  projectIdLocked={!!projectId}
                  projects={projects}
                  user={user}
                />
              )}
            </div>

            <div className="flex justify-between">
              <div className="space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                {analysisResult && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard()}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('text')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </>
                )}
              </div>
              <div className="space-x-2">
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {analysisType === 'user-story-generation' ? 'Generate Story' : 'Analyze with AI'}
                    </>
                  )}
                </Button>
                {analysisResult && !analysisResult.splitStories && (
                  user ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCreateStory()}
                        disabled={createStory.isPending || createEpic.isPending || (saveToCanvas && !selectedProjectId)}
                      >
                        {saveToCanvas ? `Add to Canvas` : `Create ${storyType}`}
                      </Button>
                      {!saveToCanvas && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSaveToCanvas(true);
                            if (projects?.[0]) setSelectedProjectId(projects[0].id);
                          }}
                        >
                          Save to Canvas Instead
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button onClick={handleSignInRedirect} variant="default">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign in to Save
                    </Button>
                  )
                )}
              </div>
            </div>

            {analysisResult && (
              <StoryAnalysisResults
                analysisResult={analysisResult}
                analysisType={analysisType}
                storyType={storyType}
                user={user}
                isSavingStories={isSavingStories}
                onSaveAllSplitStories={handleSaveAllSplitStories}
                onCreateStory={handleCreateStory}
                onCopyToClipboard={(content) => handleCopyToClipboard(content)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
  );
}
