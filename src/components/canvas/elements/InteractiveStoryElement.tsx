import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Sparkles, Loader2, X, Settings, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIToolElement from './AIToolElement';

interface StoryData {
  title: string;
  story: string;
  acceptanceCriteria?: string[];
  priority: string;
  storyPoints: number;
  epic?: string;
  status: string;
}

interface InteractiveStoryElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: StoryData;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: StoryData) => void;
  onDelete?: () => void;
}

export const InteractiveStoryElement: React.FC<InteractiveStoryElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
  onContentChange,
  onDelete,
}) => {
  const [mode, setMode] = useState<'input' | 'display'>(!data ? 'input' : 'display');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAcceptanceCriteria, setShowAcceptanceCriteria] = useState(false);
  const [formData, setFormData] = useState({
    feature: '',
    userRole: 'user',
    goal: '',
    context: '',
  });
  const [storyData, setStoryData] = useState<StoryData | null>(data || null);
  
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateStory = async () => {
    if (!formData.feature) {
      toast({
        title: "Missing Information",
        description: "Please describe the feature to generate a user story",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-user-story', {
        body: formData
      });

      if (error) throw new Error(error.message);

      const raw = typeof data === "string" ? JSON.parse(data) : data;
      if (!raw?.success) {
        throw new Error('AI response could not be parsed');
      }

      const generatedStory = raw.data;
      setStoryData(generatedStory);
      onContentChange?.(generatedStory);
      setMode('display');
      
      toast({
        title: "User Story Generated!",
        description: "Your user story is ready for review"
      });
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate user story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setMode('input');
  };

  const handleCancel = () => {
    if (storyData) {
      setMode('display');
    } else {
      onDelete?.();
    }
  };

  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const renderInputForm = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="feature" className="text-xs font-medium">
            Feature Description *
          </Label>
          <Textarea
            id="feature"
            value={formData.feature}
            onChange={(e) => handleInputChange('feature', e.target.value)}
            placeholder="Describe the feature you want to create a user story for..."
            className="text-xs min-h-20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="userRole" className="text-xs font-medium">
              User Role
            </Label>
            <Input
              id="userRole"
              value={formData.userRole}
              onChange={(e) => handleInputChange('userRole', e.target.value)}
              placeholder="e.g., customer, admin"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-xs font-medium">
              User Goal
            </Label>
            <Input
              id="goal"
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              placeholder="What they want to achieve"
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="context" className="text-xs font-medium">
            Additional Context
          </Label>
          <Textarea
            id="context"
            value={formData.context}
            onChange={(e) => handleInputChange('context', e.target.value)}
            placeholder="Business context, constraints, etc."
            className="text-xs min-h-16"
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          onClick={generateStory}
          disabled={isGenerating}
          size="sm"
          className="text-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Story
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStoryDisplay = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Story</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {storyData?.priority && (
            <Badge variant="outline" className={cn("text-xs", getPriorityColor(storyData.priority))}>
              {storyData.priority}
            </Badge>
          )}
          {storyData?.storyPoints && (
            <Badge variant="secondary" className="text-xs">
              {storyData.storyPoints} pts
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium line-clamp-2">
          {storyData?.title || 'No title'}
        </h4>
        
        <p className="text-xs text-muted-foreground line-clamp-3">
          {storyData?.story || 'No story content'}
        </p>

        {storyData?.acceptanceCriteria && storyData.acceptanceCriteria.length > 0 && (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAcceptanceCriteria(!showAcceptanceCriteria)}
              className="text-xs h-6 p-1"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Acceptance Criteria ({storyData.acceptanceCriteria.length})
            </Button>
            
            {showAcceptanceCriteria && (
              <div className="pl-2 border-l-2 border-muted">
                {storyData.acceptanceCriteria.map((criteria, index) => (
                  <div key={index} className="text-xs text-muted-foreground mb-1">
                    • {criteria}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {storyData?.epic && (
            <Badge variant="outline" className="text-xs">
              Epic: {storyData.epic}
            </Badge>
          )}
          {storyData?.status && (
            <Badge variant="secondary" className="text-xs">
              {storyData.status}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          onClick={generateStory}
          disabled={isGenerating}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Regenerate
        </Button>
      </div>
    </div>
  );

  const element = {
    id,
    type: 'story' as const,
    position,
    size,
    content: storyData || {}
  };

  return (
    <AIToolElement
      element={element}
      isSelected={isSelected || false}
      onSelect={onSelect || (() => {})}
      onUpdate={handleUpdate}
      onDelete={onDelete || (() => {})}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">User Story</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          AI Tool
        </Badge>
      </div>
      
      {mode === 'input' ? renderInputForm() : renderStoryDisplay()}
    </AIToolElement>
  );
};