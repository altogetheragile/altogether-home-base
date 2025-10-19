import { useState } from 'react';
import { StoryList } from '@/components/stories/StoryList';
import { UserStoryClarifierDialog } from '@/components/stories/UserStoryClarifierDialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus } from 'lucide-react';

export default function UserStoryCanvas() {
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">User Story Canvas</h1>
          <p className="text-muted-foreground mt-2">
            Manage epics, features, stories, and tasks with AI-powered generation and rich metadata
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAIDialog(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Manually
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <StoryList />
      </div>

      <UserStoryClarifierDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
      />

      <UserStoryClarifierDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
