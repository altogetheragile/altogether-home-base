import { describe, it, expect } from 'vitest';
import {
  mapGeneratedStoryToUserStory,
  mapGeneratedEpicToEpic,
  mapGeneratedFeatureToFeature,
  calculateReadiness,
  calculateCompletion,
  getConfidenceLevelLabel,
  getConfidenceLevelColor,
} from './storyMetadata';
import type { GeneratedStory, GeneratedEpic, GeneratedFeature } from '@/types/ai-generation';

describe('storyMetadata utilities', () => {
  describe('mapGeneratedStoryToUserStory', () => {
    it('should map generated story to user story format', () => {
      const generated: GeneratedStory = {
        title: 'User Login',
        story: 'As a user, I want to log in',
        acceptance_criteria: ['Valid credentials accepted', 'Invalid rejected'],
        user_persona: 'End User',
        business_objective: 'Improve security',
        user_value: 'Secure access',
        technical_notes: 'Use JWT tokens',
        dependencies: ['Authentication service'],
        risks: ['Password complexity'],
        estimated_effort_hours: 8,
        business_value_score: 9,
        technical_complexity_score: 6,
        confidence_level: 4,
        definition_of_ready: [
          { item: 'Requirements clear', completed: true },
          { item: 'Design approved', completed: false },
        ],
        definition_of_done: [
          { item: 'Tests written', completed: false },
          { item: 'Code reviewed', completed: false },
        ],
      };

      const result = mapGeneratedStoryToUserStory(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Login',
        description: 'As a user, I want to log in',
        acceptance_criteria: ['Valid credentials accepted', 'Invalid rejected'],
        user_persona: 'End User',
        business_objective: 'Improve security',
        user_value: 'Secure access',
        technical_notes: 'Use JWT tokens',
        estimated_effort_hours: 8,
        business_value_score: 9,
        technical_complexity_score: 6,
        confidence_level: 4,
      });

      expect(result.dependencies).toEqual(['Authentication service']);
      expect(result.definition_of_ready).toHaveLength(2);
      expect(result.definition_of_done).toHaveLength(2);
    });
  });

  describe('mapGeneratedEpicToEpic', () => {
    it('should map generated epic to epic format', () => {
      const generated: GeneratedEpic = {
        title: 'User Management System',
        description: 'Complete system for managing users',
        businessObjective: 'Streamline operations',
        success_metrics: ['User satisfaction > 90%'],
        estimated_effort_hours: 160,
        business_value_score: 10,
        confidence_level: 3,
      };

      const result = mapGeneratedEpicToEpic(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Management System',
        description: 'Complete system for managing users',
        project_id: 'project-123',
        business_objective: 'Streamline operations',
        estimated_effort_hours: 160,
        business_value_score: 10,
        confidence_level: 3,
      });

      expect(result.success_metrics).toEqual(['User satisfaction > 90%']);
    });
  });

  describe('calculateReadiness', () => {
    it('should calculate correct readiness percentage', () => {
      const items = [
        { item: 'Item 1', completed: true },
        { item: 'Item 2', completed: true },
        { item: 'Item 3', completed: false },
        { item: 'Item 4', completed: false },
      ];

      expect(calculateReadiness(items)).toBe(50);
    });

    it('should return 0 for empty array', () => {
      expect(calculateReadiness([])).toBe(0);
    });

    it('should return 100 for all completed', () => {
      const items = [
        { item: 'Item 1', completed: true },
        { item: 'Item 2', completed: true },
      ];

      expect(calculateReadiness(items)).toBe(100);
    });
  });

  describe('calculateCompletion', () => {
    it('should calculate correct completion percentage', () => {
      const items = [
        { item: 'Item 1', completed: true },
        { item: 'Item 2', completed: false },
        { item: 'Item 3', completed: false },
      ];

      expect(calculateCompletion(items)).toBe(33);
    });
  });

  describe('getConfidenceLevelLabel', () => {
    it('should return correct labels for each level', () => {
      expect(getConfidenceLevelLabel(1)).toBe('Very Low');
      expect(getConfidenceLevelLabel(2)).toBe('Low');
      expect(getConfidenceLevelLabel(3)).toBe('Medium');
      expect(getConfidenceLevelLabel(4)).toBe('High');
      expect(getConfidenceLevelLabel(5)).toBe('Very High');
    });

    it('should return Medium for invalid levels', () => {
      expect(getConfidenceLevelLabel(0)).toBe('Medium');
      expect(getConfidenceLevelLabel(6)).toBe('Medium');
    });
  });

  describe('getConfidenceLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getConfidenceLevelColor(1)).toBe('destructive');
      expect(getConfidenceLevelColor(2)).toBe('secondary');
      expect(getConfidenceLevelColor(3)).toBe('default');
      expect(getConfidenceLevelColor(4)).toBe('default');
      expect(getConfidenceLevelColor(5)).toBe('default');
    });
  });

});
