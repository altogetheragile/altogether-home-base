import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Search, ChevronDown, ChevronUp, Scissors, GitBranch } from 'lucide-react';
import { useUserStories, useEpics, useFeatures, useStoryMutations, type UserStory, type Epic } from '@/hooks/useUserStories';
import { UserStoryClarifierDialog } from './UserStoryClarifierDialog';
import { UnifiedStoryEditDialog } from './UnifiedStoryEditDialog';
import { SplitStoryDialog, SplitConfig } from './SplitStoryDialog';
import { useSplitUserStory } from '@/hooks/useSplitStory';
import { UnifiedStoryData, UnifiedStoryMode } from '@/types/story';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  ready: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  testing: 'bg-orange-500',
  done: 'bg-green-500',
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function StoryList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showClarifier, setShowClarifier] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | Epic | null>(null);
  const [editingType, setEditingType] = useState<UnifiedStoryMode>('story');
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [splittingStory, setSplittingStory] = useState<UserStory | null>(null);

  const { data: stories = [], isLoading: storiesLoading } = useUserStories();
  const { data: epics = [], isLoading: epicsLoading } = useEpics();
  const { data: features = [], isLoading: featuresLoading } = useFeatures();
  const { deleteStory, updateStory, updateEpic } = useStoryMutations();
  const splitStory = useSplitUserStory();
  const { toast } = useToast();

  const handleSplitStory = async (config: SplitConfig) => {
    if (!splittingStory) return;
    await splitStory.mutateAsync({ parentStory: splittingStory, config });
    setSplittingStory(null);
  };

  // Count child stories for display
  const getChildCount = (storyId: string) => {
    return stories.filter(s => s.parent_story_id === storyId).length;
  };

  // Get parent story title
  const getParentTitle = (parentId?: string) => {
    if (!parentId) return null;
    return stories.find(s => s.id === parentId)?.title;
  };

  const handleEditStory = (story: UserStory | Epic, type: UnifiedStoryMode) => {
    setEditingStory(story);
    setEditingType(type);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingStory(null);
  };

  const handleSaveStory = async (data: UnifiedStoryData) => {
    if (!editingStory) return;

    try {
      if (editingType === 'epic') {
        await updateEpic.mutateAsync({
          id: editingStory.id,
          title: data.title,
          description: data.description,
          status: data.status as any,
          theme: (editingStory as Epic).theme,
        });
      } else {
        await updateStory.mutateAsync({
          id: editingStory.id,
          title: data.title,
          description: data.description,
          status: data.status as any,
          priority: data.priority,
          story_points: data.story_points,
          acceptance_criteria: data.acceptance_criteria?.filter(c => c.trim()) || [],
        });
      }

      toast({
        title: "Success!",
        description: `${editingType === 'epic' ? 'Epic' : 'Story'} updated successfully.`,
      });
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCriteriaExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedCriteria(newExpanded);
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (story.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Convert story/epic to UnifiedStoryData for the dialog
  const getDialogData = (): Partial<UnifiedStoryData> | undefined => {
    if (!editingStory) return undefined;
    
    if (editingType === 'epic') {
      const epic = editingStory as Epic;
      return {
        id: epic.id,
        title: epic.title,
        description: epic.description,
        status: epic.status,
        business_value: epic.business_objective,
      };
    } else {
      const story = editingStory as UserStory;
      return {
        id: story.id,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        story_points: story.story_points,
        acceptance_criteria: story.acceptance_criteria,
        epic_id: story.epic_id,
      };
    }
  };

  if (storiesLoading || epicsLoading || featuresLoading) {
    return <div className="flex justify-center p-8">Loading stories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Stories</h2>
        <Button onClick={() => setShowClarifier(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Story
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Epics */}
      {epics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Epics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {epics.map((epic) => (
              <Card 
                key={epic.id} 
                className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow"
                onDoubleClick={() => handleEditStory(epic, 'epic')}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{epic.title}</CardTitle>
                    <Badge variant="outline" className={`${statusColors[epic.status]} text-white`}>
                      {epic.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {epic.description && (
                    <p className="text-sm text-muted-foreground mb-3">{epic.description}</p>
                  )}
                  {epic.theme && (
                    <Badge variant="secondary" className="mb-3">{epic.theme}</Badge>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditStory(epic, 'epic')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteStory.mutate(epic.id)}
                      disabled={deleteStory.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* User Stories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">User Stories ({filteredStories.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story) => {
            const childCount = getChildCount(story.id);
            const parentTitle = getParentTitle(story.parent_story_id);
            const hasAcceptanceCriteria = story.acceptance_criteria && story.acceptance_criteria.length > 0;
            
            return (
              <Card 
                key={story.id} 
                className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${story.parent_story_id ? 'border-l-purple-400' : 'border-l-blue-500'}`}
                onDoubleClick={() => handleEditStory(story, 'story')}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Parent/Child indicators */}
                      {parentTitle && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-1">
                          <GitBranch className="h-3 w-3" />
                          <span>Child of: {parentTitle.substring(0, 30)}{parentTitle.length > 30 ? '...' : ''}</span>
                        </div>
                      )}
                      {childCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-primary mb-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{childCount} child {childCount === 1 ? 'story' : 'stories'}</span>
                        </div>
                      )}
                      <CardTitle className="text-lg leading-tight">
                        {story.title.startsWith('As a') ? story.title : `As a user, I want ${story.title.toLowerCase()}`}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge variant="outline" className={`${statusColors[story.status]} text-white`}>
                        {story.status}
                      </Badge>
                      <Badge className={priorityColors[story.priority]}>
                        {story.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {story.description && (
                    <p className="text-sm text-muted-foreground mb-3">{story.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="outline">{story.issue_type}</Badge>
                    {story.story_points && (
                      <Badge variant="secondary">{story.story_points} pts</Badge>
                    )}
                  </div>

                  {hasAcceptanceCriteria && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Acceptance Criteria:</p>
                      <div className="space-y-1">
                        {story.acceptance_criteria!.slice(0, expandedCriteria.has(story.id) ? undefined : 2).map((criteria, index) => (
                          <div key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary/30">
                            {criteria}
                          </div>
                        ))}
                        {story.acceptance_criteria!.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCriteriaExpansion(story.id)}
                            className="text-xs text-muted-foreground h-auto p-1 hover:text-foreground"
                          >
                            {expandedCriteria.has(story.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                +{story.acceptance_criteria!.length - 2} more criteria
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    {/* Split button - only show if story has acceptance criteria */}
                    {hasAcceptanceCriteria && story.acceptance_criteria!.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSplittingStory(story)}
                        title="Split by Acceptance Criteria"
                      >
                        <Scissors className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEditStory(story, 'story')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteStory.mutate(story.id)}
                      disabled={deleteStory.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No stories found matching your filters.</p>
          </div>
        )}
      </div>

      <UserStoryClarifierDialog 
        isOpen={showClarifier} 
        onClose={() => setShowClarifier(false)} 
      />
      
      <UnifiedStoryEditDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) handleCloseEditDialog();
        }}
        data={getDialogData()}
        onSave={handleSaveStory}
        mode={editingType}
        isLoading={updateStory.isPending || updateEpic.isPending}
      />

      <SplitStoryDialog
        open={!!splittingStory}
        onOpenChange={(open) => !open && setSplittingStory(null)}
        story={splittingStory}
        onSplit={handleSplitStory}
        isLoading={splitStory.isPending}
      />
    </div>
  );
}
