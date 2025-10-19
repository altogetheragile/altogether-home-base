/**
 * Centralized type exports
 */

// AI Generation types
export type {
  StoryLevel,
  ParentContext,
  AdditionalFields,
  GenerateStoryRequest,
  GenerateStoryResponse,
  GeneratedEpic,
  GeneratedFeature,
  GeneratedStory,
  GeneratedTask,
  GeneratedStoryData,
  AIGenerationAudit,
  RateLimitInfo,
  AIGenerationError,
} from './ai-generation';

// Core domain types
export type { UserStory, Epic, Feature } from '@/hooks/useUserStories';

// Re-export existing types for convenience
export type { 
  Page, 
  ContentBlock, 
  PageWithBlocks,
  ContentBlockCreate,
  ContentBlockUpdate 
} from './page';

export type { 
  EventTemplate,
  LearningResource,
  KnowledgeTemplate,
  KnowledgeItemTemplate,
  TemplateType,
  FileFormat 
} from './template';

export type { 
  UnifiedContent,
  ContentType,
  EventMetadata,
  BlogMetadata,
  KnowledgeMetadata 
} from './content';
