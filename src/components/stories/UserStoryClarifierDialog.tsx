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
import { Loader2, Sparkles, Split, Combine, CheckCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from '@/hooks/useUserStories';

interface UserStoryClarifierDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoryAnalysisResult {
  analysisType: string;
  suggestions?: string[];
  acceptanceCriteria?: string[];
  refinementQuestions?: string[];
  splitStories?: Array<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
  }>;
  spidrAnalysis?: {
    spike: string[];
    path: string[];
    interface: string[];
    data: string[];
    rules: string[];
  };
}

export function UserStoryClarifierDialog({ isOpen, onClose }: UserStoryClarifierDialogProps) {
  const [storyType, setStoryType] = useState<'epic' | 'feature' | 'story'>('story');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [analysisType, setAnalysisType] = useState<'spidr' | 'split' | 'acceptance_criteria' | 'refine'>('refine');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StoryAnalysisResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { toast } = useToast();
  const { createStory, createEpic } = useStoryMutations();

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

      if (error) throw error;
      setAnalysisResult(data.generatedCanvas);
    } catch (error) {
      console.error('Error analyzing story:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze story",
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
      
      if (!storyData) {
        handleReset();
        onClose();
      }
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setAnalysisResult(null);
    setAnalysisType('spidr');
    setStoryType('story');
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
                    {items.map((item: string, index: number) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {analysisResult.splitStories && (
            <div className="space-y-3">
              <h4 className="font-semibold">Suggested Split Stories:</h4>
              {analysisResult.splitStories.map((story, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{story.title}</h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateStory(story)}
                        disabled={createStory.isPending}
                      >
                        Create Story
                      </Button>
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
                  <span className="text-sm">{question}</span>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Story Clarifier - Turn Ideas into User Stories</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                  <Label htmlFor="storyType">Story Type</Label>
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
                  <Label htmlFor="analysisType">Analysis Type</Label>
                  <Select value={analysisType} onValueChange={(value: 'spidr' | 'split' | 'acceptance_criteria' | 'refine') => setAnalysisType(value)}>
                    <SelectTrigger id="analysisType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refine">Story Refinement (Default)</SelectItem>
                      <SelectItem value="acceptance_criteria">Acceptance Criteria</SelectItem>
                      <SelectItem value="spidr">SPIDR Analysis</SelectItem>
                      <SelectItem value="split">Split Into Smaller Stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
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
                    Analyze with AI
                  </>
                )}
              </Button>
              {analysisResult && !analysisResult.splitStories && (
                <Button onClick={() => handleCreateStory()} disabled={createStory.isPending || createEpic.isPending}>
                  Create {storyType}
                </Button>
              )}
            </div>
          </div>

          {renderAnalysisResult()}
        </div>
      </DialogContent>
    </Dialog>
  );
}