// Unified Story Data Types

export type StoryPriority = 'critical' | 'high' | 'medium' | 'low';
export type StoryStatus = 'idea' | 'draft' | 'refined' | 'ready' | 'in_progress' | 'testing' | 'done';
export type EpicStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface UnifiedStoryData {
  // Core (required)
  id?: string;
  title: string;
  description?: string | null;
  acceptance_criteria?: string[] | null;
  
  // Estimation
  story_points?: number | null;
  priority?: StoryPriority;
  estimated_value?: number | null;
  estimated_effort?: number | null;
  confidence_level?: number | null;
  
  // Tracking  
  status?: StoryStatus | string;
  sprint?: string | null;
  target_release?: string | null;
  tags?: string[] | null;
  source?: string | null;
  
  // Rich metadata (optional)
  user_persona?: string | null;
  problem_statement?: string | null;
  business_value?: string | null;
  
  // Links
  user_story_id?: string | null;
  epic_id?: string | null;
}

export type UnifiedStoryMode = 'backlog' | 'story' | 'epic';

export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

export const PRIORITIES: { value: StoryPriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'bg-destructive text-destructive-foreground' },
  { value: 'high', label: 'High', color: 'bg-orange-500 text-white' },
  { value: 'medium', label: 'Medium', color: 'bg-primary text-primary-foreground' },
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
];

export const BACKLOG_STATUSES: { value: string; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'refined', label: 'Refined' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const STORY_STATUSES: { value: StoryStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
];

export const EPIC_STATUSES: { value: EpicStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SOURCES: { value: string; label: string }[] = [
  { value: 'user_feedback', label: 'User Feedback' },
  { value: 'development', label: 'Development' },
  { value: 'bug_fix', label: 'Bug Fix' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'ai_suggestion', label: 'AI Suggestion' },
];
