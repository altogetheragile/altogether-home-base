/**
 * AI Story Generation Types
 * Matches the edge function interface and database schema
 */

export type StoryLevel = 'epic' | 'feature' | 'story' | 'task';

export interface ParentContext {
  level: StoryLevel;
  title: string;
  description?: string;
  businessObjective?: string;
  userValue?: string;
}

export interface AdditionalFields {
  userRole?: string;
  goal?: string;
  context?: string;
}

export interface GenerateStoryRequest {
  storyLevel: StoryLevel;
  userInput: string;
  parentContext?: ParentContext;
  additionalFields?: AdditionalFields;
  parentId?: string;
}

export interface GenerateStoryResponse {
  success: boolean;
  data?: GeneratedStoryData;
  error?: string;
  metadata?: {
    level: StoryLevel;
    tokenCount: number;
    executionTime: number;
  };
}

// Epic generation response
export interface GeneratedEpic {
  title: string;
  description: string;
  businessObjective: string;
  successMetrics: string[];
  theme: string;
  stakeholders: string[];
  startDate: string; // ISO format
  targetDate: string; // ISO format
  status: 'draft';
}

// Feature generation response
export interface GeneratedFeature {
  title: string;
  description: string;
  userValue: string;
  acceptanceCriteria: string[];
  epicId?: string;
  status: 'draft' | 'in_progress' | 'completed';
  priority: 'High' | 'Medium' | 'Low';
}

// Story generation response (rich metadata)
export interface GeneratedStory {
  title: string;
  story: string;
  acceptanceCriteria: string[];
  priority: 'High' | 'Medium' | 'Low';
  storyPoints: number;
  userPersona: string;
  problemStatement: string;
  businessValue: string;
  assumptionsRisks: string;
  technicalNotes: string;
  dependencies: string[];
  storyType: 'feature' | 'spike' | 'bug' | 'chore' | 'task';
  tags: string[];
  definitionOfReady: {
    items: Array<{ label: string; checked: boolean }>;
  };
  definitionOfDone: {
    items: Array<{ label: string; checked: boolean }>;
  };
  confidenceLevel: number;
  customerJourneyStage: string;
  status: 'To Do';
}

// Task generation response
export interface GeneratedTask {
  title: string;
  description: string;
  technicalNotes: string;
  storyPoints: number;
  acceptanceCriteria: string[];
  storyType: 'task';
  status: 'To Do';
  priority: 'High' | 'Medium' | 'Low';
}

export type GeneratedStoryData = 
  | GeneratedEpic 
  | GeneratedFeature 
  | GeneratedStory 
  | GeneratedTask;

// Audit log types
export interface AIGenerationAudit {
  id: string;
  user_id: string | null;
  story_level: StoryLevel;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  token_count?: number;
  execution_time_ms?: number;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Rate limit info
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
}

// Error types
export interface AIGenerationError {
  code: 'RATE_LIMIT_EXCEEDED' | 'VALIDATION_ERROR' | 'API_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: Record<string, any>;
}
