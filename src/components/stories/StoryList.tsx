import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useUserStories, useEpics, useFeatures, useStoryMutations, type UserStory, type Epic, type Feature } from '@/hooks/useUserStories';
import { UserStoryClarifierDialog } from './UserStoryClarifierDialog';
import { StoryEditDialog } from './StoryEditDialog';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  draft: 'bg-gray-500',
  ready: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  testing: 'bg-orange-500',
  done: 'bg-green-500',
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

interface StoryListProps {
  stories?: UserStory[];
  epics?: Epic[];
  features?: Feature[];
  mode?: 'database' | 'canvas';
  canvasId?: string;
}

export function StoryList({ 
  stories: propStories, 
  epics: propEpics, 
  features: propFeatures,
  mode = 'database',
  canvasId 
}: StoryListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showClarifier, setShowClarifier] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | Epic | null>(null);
  const [editingType, setEditingType] = useState<'story' | 'epic'>('story');
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  // Use props if provided, otherwise fetch from database
  const { data: dbStories = [], isLoading: storiesLoading } = useUserStories();
  const { data: dbEpics = [], isLoading: epicsLoading } = useEpics();
  const { data: dbFeatures = [], isLoading: featuresLoading } = useFeatures();
  const { deleteStory } = useStoryMutations();

  const stories = propStories || dbStories;
  const epics = propEpics || dbEpics;
  const features = propFeatures || dbFeatures;

  const handleEditStory = (story: UserStory | Epic, type: 'story' | 'epic') => {
    if (mode === 'canvas') {
      // Navigate to canvas with element highlighted
      navigate(`/user-story-canvas?highlight=${story.id}`);
    } else {
      setEditingStory(story);
      setEditingType(type);
      setShowEditDialog(true);
    }
  };

  const handleViewOnCanvas = (storyId: string) => {
    navigate(`/user-story-canvas?highlight=${storyId}`);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingStory(null);
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
              <Card key={epic.id} className="border-l-4 border-l-purple-500">
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
                    {mode === 'canvas' ? (
                      <Button size="sm" variant="outline" onClick={() => handleViewOnCanvas(epic.id)}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Canvas
                      </Button>
                    ) : (
                      <>
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
                      </>
                    )}
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
          {filteredStories.map((story) => (
            <Card key={story.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">
                    {story.title.startsWith('As a') ? story.title : `As a user, I want ${story.title.toLowerCase()}`}
                  </CardTitle>
                  <div className="flex gap-1">
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

                {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Acceptance Criteria:</p>
                    <div className="space-y-1">
                      {story.acceptance_criteria.slice(0, expandedCriteria.has(story.id) ? undefined : 2).map((criteria, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary/30">
                          {criteria}
                        </div>
                      ))}
                      {story.acceptance_criteria.length > 2 && (
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
                              +{story.acceptance_criteria.length - 2} more criteria
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {mode === 'canvas' ? (
                    <Button size="sm" variant="outline" onClick={() => handleViewOnCanvas(story.id)}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on Canvas
                    </Button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
      
      <StoryEditDialog
        isOpen={showEditDialog}
        onClose={handleCloseEditDialog}
        story={editingStory}
        type={editingType}
      />
    </div>
  );
}