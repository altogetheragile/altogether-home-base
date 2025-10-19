/**
 * Utilities for working with rich story metadata
 */

import type { UserStory, Epic, Feature } from '@/hooks/useUserStories';
import type { GeneratedStory, GeneratedEpic, GeneratedFeature } from '@/types/ai-generation';

/**
 * Convert AI-generated story to UserStory format for database insertion
 */
export function mapGeneratedStoryToUserStory(
  generated: GeneratedStory,
  options?: {
    epicId?: string;
    featureId?: string;
    projectId?: string;
  }
): Omit<UserStory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {
  return {
    title: generated.title,
    description: generated.story,
    acceptance_criteria: generated.acceptanceCriteria,
    story_points: generated.storyPoints,
    status: 'draft',
    priority: generated.priority.toLowerCase() as 'low' | 'medium' | 'high',
    issue_type: 'story',
    epic_id: options?.epicId,
    feature_id: options?.featureId,
    
    // Rich metadata
    user_persona: generated.userPersona,
    problem_statement: generated.problemStatement,
    business_value: generated.businessValue,
    assumptions_risks: generated.assumptionsRisks,
    technical_notes: generated.technicalNotes,
    dependencies: generated.dependencies,
    story_type: generated.storyType,
    tags: generated.tags,
    definition_of_ready: generated.definitionOfReady,
    definition_of_done: generated.definitionOfDone,
    confidence_level: generated.confidenceLevel,
    customer_journey_stage: generated.customerJourneyStage,
  };
}

/**
 * Convert AI-generated epic to Epic format for database insertion
 */
export function mapGeneratedEpicToEpic(
  generated: GeneratedEpic,
  options?: {
    projectId?: string;
  }
): Omit<Epic, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {
  return {
    title: generated.title,
    description: generated.description,
    theme: generated.theme,
    status: 'draft',
    business_objective: generated.businessObjective,
    success_metrics: generated.successMetrics,
    stakeholders: generated.stakeholders,
    start_date: generated.startDate,
    target_date: generated.targetDate,
    project_id: options?.projectId,
  };
}

/**
 * Convert AI-generated feature to Feature format for database insertion
 */
export function mapGeneratedFeatureToFeature(
  generated: GeneratedFeature,
  options?: {
    epicId?: string;
    projectId?: string;
  }
): Omit<Feature, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {
  return {
    title: generated.title,
    description: generated.description,
    epic_id: options?.epicId || generated.epicId,
    user_value: generated.userValue,
    acceptance_criteria: generated.acceptanceCriteria,
    status: generated.status,
    project_id: options?.projectId,
  };
}

/**
 * Calculate story readiness based on Definition of Ready
 */
export function calculateReadiness(story: UserStory): {
  percentage: number;
  completedCount: number;
  totalCount: number;
} {
  if (!story.definition_of_ready?.items) {
    return { percentage: 0, completedCount: 0, totalCount: 0 };
  }

  const items = story.definition_of_ready.items;
  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return { percentage, completedCount, totalCount };
}

/**
 * Calculate story completion based on Definition of Done
 */
export function calculateCompletion(story: UserStory): {
  percentage: number;
  completedCount: number;
  totalCount: number;
} {
  if (!story.definition_of_done?.items) {
    return { percentage: 0, completedCount: 0, totalCount: 0 };
  }

  const items = story.definition_of_done.items;
  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return { percentage, completedCount, totalCount };
}

/**
 * Get confidence level label
 */
export function getConfidenceLevelLabel(level: number): string {
  if (level >= 5) return 'Very High';
  if (level >= 4) return 'High';
  if (level >= 3) return 'Medium';
  if (level >= 2) return 'Low';
  return 'Very Low';
}

/**
 * Get confidence level color for UI
 */
export function getConfidenceLevelColor(level: number): string {
  if (level >= 5) return 'text-green-600';
  if (level >= 4) return 'text-green-500';
  if (level >= 3) return 'text-yellow-500';
  if (level >= 2) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Validate required fields based on story level
 */
export function validateStoryLevel(
  level: 'epic' | 'feature' | 'story' | 'task',
  data: Partial<UserStory | Epic | Feature>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (level === 'story' && !data.description) {
    errors.push('User story description is required');
  }

  if (level === 'epic' && !('business_objective' in data && data.business_objective)) {
    errors.push('Business objective is required for epics');
  }

  if (level === 'feature' && !('user_value' in data && data.user_value)) {
    errors.push('User value is required for features');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Default Definition of Ready items
 */
export const DEFAULT_DEFINITION_OF_READY = {
  items: [
    { label: 'Acceptance criteria defined', checked: false },
    { label: 'Dependencies identified', checked: false },
    { label: 'Story sized appropriately', checked: false },
    { label: 'User value is clear', checked: false },
  ]
};

/**
 * Default Definition of Done items
 */
export const DEFAULT_DEFINITION_OF_DONE = {
  items: [
    { label: 'Code reviewed and merged', checked: false },
    { label: 'Tests written and passing', checked: false },
    { label: 'Documentation updated', checked: false },
    { label: 'Acceptance criteria met', checked: false },
  ]
};
