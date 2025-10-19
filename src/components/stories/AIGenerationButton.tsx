import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIStoryGeneration } from '@/hooks/useAIStoryGeneration';
import { Sparkles, Loader2 } from 'lucide-react';
import type { StoryLevel, ParentContext } from '@/types/ai-generation';

interface AIGenerationButtonProps {
  onGenerated?: (data: any, level: StoryLevel) => void;
  parentContext?: ParentContext;
  parentId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AIGenerationButton({
  onGenerated,
  parentContext,
  parentId,
  variant = 'default',
  size = 'default'
}: AIGenerationButtonProps) {
  const [open, setOpen] = useState(false);
  const [storyLevel, setStoryLevel] = useState<StoryLevel>('story');
  const [userInput, setUserInput] = useState('');
  const [userRole, setUserRole] = useState('');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');

  const { generateStoryAsync, isGenerating } = useAIStoryGeneration();

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    try {
      const response = await generateStoryAsync({
        storyLevel,
        userInput: userInput.trim(),
        parentContext,
        additionalFields: {
          userRole: userRole.trim() || undefined,
          goal: goal.trim() || undefined,
          context: context.trim() || undefined,
        },
        parentId,
      });

      if (response?.data) {
        onGenerated?.(response.data, storyLevel);
        handleClose();
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setUserInput('');
    setUserRole('');
    setGoal('');
    setContext('');
  };

  const getPlaceholder = () => {
    switch (storyLevel) {
      case 'epic':
        return 'E.g., "Improve customer onboarding experience"';
      case 'feature':
        return 'E.g., "User profile management"';
      case 'story':
        return 'E.g., "User can update their email address"';
      case 'task':
        return 'E.g., "Implement email validation function"';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Generate with AI</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Story Generation</DialogTitle>
          <DialogDescription>
            Generate rich, detailed stories with AI assistance. Includes metadata, acceptance criteria, and more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="level">Story Level</Label>
            <Select value={storyLevel} onValueChange={(value) => setStoryLevel(value as StoryLevel)}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="epic">Epic - Strategic Initiative</SelectItem>
                <SelectItem value="feature">Feature - User Capability</SelectItem>
                <SelectItem value="story">Story - Specific Requirement</SelectItem>
                <SelectItem value="task">Task - Implementation Work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="input"
              placeholder={getPlaceholder()}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {storyLevel === 'story' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">User Role (Optional)</Label>
                <Input
                  id="role"
                  placeholder="E.g., registered user, admin, customer"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Goal (Optional)</Label>
                <Input
                  id="goal"
                  placeholder="What does the user want to achieve?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Any additional information to help generate better results..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {parentContext && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-1">Parent Context</p>
              <p className="text-sm text-muted-foreground">
                {parentContext.level}: {parentContext.title}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!userInput.trim() || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
