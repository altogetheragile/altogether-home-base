import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCanvas } from '@/hooks/useCanvas';
import { StoryList } from '@/components/stories/StoryList';
import { Card } from '@/components/ui/card';
import type { UserStory, Epic, Feature } from '@/hooks/useUserStories';

export default function StoriesPage() {
  const { user } = useAuth();
  const { data: canvas, isLoading } = useCanvas(undefined, user?.id, 'user-story');

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Transform canvas elements to story list format
  const elements = canvas?.data?.elements || [];
  
  const stories: UserStory[] = elements
    .filter((el: any) => el.metadata?.storyLevel === 'story' || el.type === 'story')
    .map((el: any) => ({
      id: el.id,
      title: el.content?.title || el.metadata?.title || 'Untitled Story',
      description: el.content?.story || el.content?.description || '',
      status: el.content?.status || 'draft',
      priority: el.content?.priority || 'medium',
      issue_type: 'story',
      story_points: el.content?.storyPoints || 3,
      acceptance_criteria: el.content?.acceptanceCriteria || [],
      created_at: el.metadata?.created_at || new Date().toISOString(),
      updated_at: el.metadata?.updated_at || new Date().toISOString(),
      created_by: user?.id || '',
      updated_by: user?.id || '',
    }));

  const epics: Epic[] = elements
    .filter((el: any) => el.metadata?.storyLevel === 'epic' || el.type === 'epic')
    .map((el: any) => ({
      id: el.id,
      title: el.content?.title || el.metadata?.title || 'Untitled Epic',
      description: el.content?.description || '',
      status: el.content?.status || 'draft',
      theme: el.content?.theme || '',
      created_at: el.metadata?.created_at || new Date().toISOString(),
      updated_at: el.metadata?.updated_at || new Date().toISOString(),
      created_by: user?.id || '',
      updated_by: user?.id || '',
    }));

  const features: Feature[] = elements
    .filter((el: any) => el.metadata?.storyLevel === 'feature' || el.type === 'feature')
    .map((el: any) => ({
      id: el.id,
      title: el.content?.title || el.metadata?.title || 'Untitled Feature',
      description: el.content?.description || '',
      status: el.content?.status || 'draft',
      priority: el.content?.priority || 'medium',
      epic_id: el.metadata?.epicId,
      created_at: el.metadata?.created_at || new Date().toISOString(),
      updated_at: el.metadata?.updated_at || new Date().toISOString(),
      created_by: user?.id || '',
      updated_by: user?.id || '',
    }));

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to view your stories</h2>
          <p className="text-muted-foreground">
            Please sign in to access your user stories and manage your agile workflow.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <StoryList 
        stories={stories}
        epics={epics}
        features={features}
        mode="canvas"
        canvasId={canvas?.id}
      />
    </div>
  );
}
