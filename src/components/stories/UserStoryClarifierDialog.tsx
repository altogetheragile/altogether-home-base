import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Split, Combine, CheckCircle, HelpCircle, Copy, Download, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from '@/hooks/useUserStories';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjects } from '@/hooks/useProjects';
import { useCanvasMutations } from '@/hooks/useCanvas';

interface UserStoryClarifierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

interface StoryAnalysisResult {
  analysisType: string;
  title?: string;
  description?: string;
  suggestions?: (string | any)[];
  acceptanceCriteria?: (string | any)[];
  refinementQuestions?: (string | any)[];
  splitStories?: Array<{
    title: string;
    description: string;
    acceptanceCriteria: (string | any)[];
  }>;
  spidrAnalysis?: {
    spike: (string | any)[];
    path: (string | any)[];
    interface: (string | any)[];
    data: (string | any)[];
    rules: (string | any)[];
  };
}

export function UserStoryClarifierDialog({ isOpen, onClose, projectId }: UserStoryClarifierDialogProps) {
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
        console.error('Error analyzing story:', error);
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

      const result = data.generatedCanvas;
      setAnalysisResult(result);
      
      // Auto-populate fields if we got a user story generation
      if (result.analysisType === 'user-story-generation' || analysisType === 'user-story-generation') {
        if (result.title) setTitle(result.title);
        if (result.description) setDescription(result.description);
      }
      
      toast({
        title: "Analysis complete!",
        description: analysisType === 'user-story-generation' ? 
          "Your user story has been generated!" : 
          "Your story has been successfully analyzed.",
      });
    } catch (error) {
      console.error('Error analyzing story:', error);
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
    acceptanceCriteria: string[];
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
            acceptance_criteria: storyToCreate.acceptanceCriteria,
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
      console.error('Error creating story:', error);
    }
  };

  const saveStoryToCanvas = async (storyData: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
  }) => {
    try {
      // Get existing canvas or create new one
      const { data: existingCanvas } = await supabase
        .from('canvases')
        .select('*')
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

      const updatedData = existingCanvas 
        ? {
            ...existingCanvas.data,
            elements: [...(existingCanvas.data?.elements || []), newElement]
          }
        : {
            elements: [newElement],
            metadata: {}
          };

      if (existingCanvas) {
        await updateCanvas.mutateAsync({
          projectId: selectedProjectId,
          data: updatedData,
        });
      } else {
        await supabase.from('canvases').insert([{
          project_id: selectedProjectId,
          data: updatedData,
        }]);
      }

      toast({
        title: "Story added to canvas",
        description: "Your story has been added to the project canvas.",
      });
    } catch (error) {
      console.error('Error saving story to canvas:', error);
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
    const textToCopy = content || formatForExport();
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
      formatForExport();
    
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-story-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: `Content exported as ${format.toUpperCase()} file.`,
    });
  };

  const formatForExport = (): string => {
    let content = `Title: ${title}\n`;
    if (description) content += `Description: ${description}\n`;
    
    if (analysisResult) {
      content += `\nAnalysis Type: ${analysisResult.analysisType}\n`;
      
      if (analysisResult.acceptanceCriteria) {
        content += '\nAcceptance Criteria:\n';
        analysisResult.acceptanceCriteria.forEach((criteria, idx) => {
          content += `${idx + 1}. ${criteria}\n`;
        });
      }
      
      if (analysisResult.suggestions) {
        content += '\nSuggestions:\n';
        analysisResult.suggestions.forEach((suggestion, idx) => {
          content += `${idx + 1}. ${suggestion}\n`;
        });
      }
      
      if (analysisResult.splitStories) {
        content += '\nSplit Stories:\n';
        analysisResult.splitStories.forEach((story, idx) => {
          content += `\n${idx + 1}. ${story.title}\n`;
          content += `   Description: ${story.description}\n`;
          if (story.acceptanceCriteria.length > 0) {
            content += '   Acceptance Criteria:\n';
            story.acceptanceCriteria.forEach((criteria) => {
              content += `   - ${criteria}\n`;
            });
          }
        });
      }
    }
    
    return content;
  };

  const handleSignInRedirect = () => {
    window.open('/auth', '_blank');
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisResult.spidrAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysisResult.spidrAnalysis).map(([key, items]) => (
                <div key={key} className="space-y-2">
                  <h4 className="font-semibold capitalize text-sm">
                    {key === 'spike' ? 'Spike (Research)' :
                     key === 'path' ? 'Path (User Journey)' :
                     key === 'interface' ? 'Interface (UI/UX)' :
                     key === 'data' ? 'Data (Storage)' :
                     'Rules (Business Logic)'}
                  </h4>
                   <div className="space-y-1">
                     {items.map((item: any, index: number) => (
                       <div key={index} className="text-sm p-2 bg-muted rounded">
                         {typeof item === 'string' ? item : 
                          typeof item === 'object' && item !== null ? 
                          ((item as any).text || (item as any).content || JSON.stringify(item)) :
                          String(item)}
                       </div>
                     ))}
                   </div>
                </div>
              ))}
            </div>
          )}

           {analysisResult.splitStories && (
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <h4 className="font-semibold">Suggested Split Stories:</h4>
                 {user && (
                   <Button
                     size="sm"
                     onClick={handleSaveAllSplitStories}
                     disabled={createStory.isPending || createEpic.isPending || createFeature.isPending || createBulkStories.isPending}
                   >
                     Save All as {storyType === 'epic' ? 'Epic + Stories' : storyType === 'feature' ? 'Feature + Stories' : 'Stories'}
                   </Button>
                 )}
               </div>
               {analysisResult.splitStories.map((story, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                     <div className="flex justify-between items-start mb-2">
                       <h5 className="font-medium">{story.title}</h5>
                       <div className="flex gap-2">
                         {user ? (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleCreateStory(story)}
                             disabled={createStory.isPending}
                           >
                             Create Story
                           </Button>
                         ) : (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleCopyToClipboard(`${story.title}\n${story.description}\n\nAcceptance Criteria:\n${story.acceptanceCriteria.join('\n')}`)}
                           >
                             <Copy className="h-3 w-3 mr-1" />
                             Copy
                           </Button>
                         )}
                       </div>
                     </div>
                    <p className="text-sm text-muted-foreground mb-2">{story.description}</p>
                    {story.acceptanceCriteria.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Acceptance Criteria:</span>
                        {story.acceptanceCriteria.map((criteria, idx) => (
                          <div key={idx} className="text-sm pl-2 border-l-2 border-muted">
                            {criteria}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {analysisResult.acceptanceCriteria && (
            <div className="space-y-2">
              <h4 className="font-semibold">Acceptance Criteria:</h4>
              {analysisResult.acceptanceCriteria.map((criteria, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span className="text-sm">{criteria}</span>
                </div>
              ))}
            </div>
          )}

          {analysisResult.refinementQuestions && (
            <div className="space-y-2">
              <h4 className="font-semibold">Refinement Questions:</h4>
              {analysisResult.refinementQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                  <HelpCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                  <span className="text-sm">
                    {typeof question === 'string' ? question : 
                     typeof question === 'object' && question !== null ? 
                     ((question as any).text || (question as any).content || (question as any).question || JSON.stringify(question)) :
                     String(question)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {analysisResult.suggestions && (
            <div className="space-y-2">
              <h4 className="font-semibold">Suggestions:</h4>
              {analysisResult.suggestions.map((suggestion, index) => (
                <div key={index} className="p-2 bg-muted rounded text-sm">
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
        acceptance_criteria: story.acceptanceCriteria,
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
      console.error('Error creating bulk stories:', error);
    }
  };

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <Label htmlFor="storyType">Story Type</Label>
                       <Popover>
                         <PopoverTrigger asChild>
                           <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground" />
                         </PopoverTrigger>
                         <PopoverContent className="w-80" side="top">
                           <div className="space-y-3">
                             <h4 className="font-medium">Story Types</h4>
                             <div className="space-y-2 text-sm">
                               <div>
                                 <strong>User Story:</strong> Small, user-focused requirement that can be completed in 1-3 days. Best for specific features.
                               </div>
                               <div>
                                 <strong>Feature:</strong> Larger functional component containing multiple user stories (1-2 weeks). Groups related functionality.
                               </div>
                               <div>
                                 <strong>Epic:</strong> High-level initiative spanning multiple features (1-3 months). Represents major product areas.
                               </div>
                             </div>
                           </div>
                         </PopoverContent>
                       </Popover>
                     </div>
                    <Select value={storyType} onValueChange={(value: 'epic' | 'feature' | 'story') => setStoryType(value)}>
                      <SelectTrigger id="storyType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story">User Story</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <Label htmlFor="analysisType">Analysis Type</Label>
                       <Popover>
                         <PopoverTrigger asChild>
                           <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground" />
                         </PopoverTrigger>
                         <PopoverContent className="w-96" side="top">
                           <div className="space-y-3">
                             <h4 className="font-medium">Analysis Types</h4>
                             <div className="space-y-3 text-sm">
                               <div>
                                 <strong>Generate User Story:</strong> Create a complete user story from scratch with title, description, and acceptance criteria. Use when starting with just an idea.
                               </div>
                               <div>
                                 <strong>Enhanced Criteria:</strong> Generate additional, detailed acceptance criteria for an existing story. Use when you already have a story but need more specific requirements.
                               </div>
                               <div>
                                 <strong>Story Refinement:</strong> Get questions and suggestions to improve story clarity and completeness. Use when your story feels incomplete or unclear.
                               </div>
                               <div>
                                 <strong>SPIDR Analysis:</strong> Break down using SPIDR framework - Spike (research needed), Path (user journey), Interface (UI/UX), Data (storage), Rules (business logic). Use for complex stories.
                               </div>
                               <div>
                                 <strong>Split Stories:</strong> Break large stories into smaller, manageable pieces. Use when stories are too big (8+ story points) or span multiple areas.
                               </div>
                             </div>
                           </div>
                         </PopoverContent>
                       </Popover>
                     </div>
                    <Select value={analysisType} onValueChange={(value: 'user-story-generation' | 'spidr' | 'split' | 'acceptance_criteria' | 'refine') => setAnalysisType(value)}>
                      <SelectTrigger id="analysisType">
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="user-story-generation">Generate User Story (Default)</SelectItem>
                         <SelectItem value="acceptance_criteria">Enhanced Criteria</SelectItem>
                         <SelectItem value="refine">Story Refinement</SelectItem>
                         <SelectItem value="spidr">SPIDR Analysis</SelectItem>
                         <SelectItem value="split">Split Into Smaller Stories</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  
                  {user && (
                    <div className="md:col-span-2 space-y-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveToCanvas"
                          checked={saveToCanvas}
                          onChange={(e) => setSaveToCanvas(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="saveToCanvas" className="text-sm font-medium">
                          Save to Project Canvas
                        </Label>
                      </div>
                      
                      {saveToCanvas && (
                        <div className="space-y-2">
                          <Label htmlFor="projectSelect">Select Project</Label>
                          <Select
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                            disabled={!!projectId}
                          >
                            <SelectTrigger id="projectSelect">
                              <SelectValue placeholder="Choose a project..." />
                            </SelectTrigger>
                            <SelectContent>
                              {projects?.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

            {renderAnalysisResult()}
          </div>
        </DialogContent>
      </Dialog>
  );
}