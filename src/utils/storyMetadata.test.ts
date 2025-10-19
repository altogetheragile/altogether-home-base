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
import type { UserStory } from '@/hooks/useUserStories';

describe('storyMetadata utilities', () => {
  describe('mapGeneratedStoryToUserStory', () => {
    it('should map generated story to user story format', () => {
      const generated: GeneratedStory = {
        title: 'User Login',
        story: 'As a user, I want to log in',
        acceptanceCriteria: ['Valid credentials accepted', 'Invalid rejected'],
        userPersona: 'End User',
        businessValue: 'Secure access',
        technicalNotes: 'Use JWT tokens',
        dependencies: ['Authentication service'],
        storyPoints: 5,
        priority: 'High',
        storyType: 'feature',
        tags: ['authentication'],
        definitionOfReady: {
          items: [
            { label: 'Requirements clear', checked: true },
            { label: 'Design approved', checked: false },
          ]
        },
        definitionOfDone: {
          items: [
            { label: 'Tests written', checked: false },
            { label: 'Code reviewed', checked: false },
          ]
        },
        confidenceLevel: 4,
        problemStatement: 'Users need to log in',
        assumptionsRisks: 'Password complexity',
        customerJourneyStage: 'activation',
        status: 'To Do',
      };

      const result = mapGeneratedStoryToUserStory(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Login',
        description: 'As a user, I want to log in',
        acceptance_criteria: ['Valid credentials accepted', 'Invalid rejected'],
        user_persona: 'End User',
        business_value: 'Secure access',
        technical_notes: 'Use JWT tokens',
        confidence_level: 4,
      });

      expect(result.dependencies).toEqual(['Authentication service']);
      expect(result.definition_of_ready).toHaveProperty('items');
      expect(result.definition_of_done).toHaveProperty('items');
    });
  });

  describe('mapGeneratedEpicToEpic', () => {
    it('should map generated epic to epic format', () => {
      const generated: GeneratedEpic = {
        title: 'User Management System',
        description: 'Complete system for managing users',
        theme: 'User Administration',
        businessObjective: 'Streamline operations',
        successMetrics: ['User satisfaction > 90%'],
        stakeholders: ['Product Team', 'Engineering'],
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        status: 'draft',
      };

      const result = mapGeneratedEpicToEpic(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Management System',
        description: 'Complete system for managing users',
        business_objective: 'Streamline operations',
      });

      expect(result.success_metrics).toEqual(['User satisfaction > 90%']);
    });
  });

  describe('calculateReadiness', () => {
    it('should calculate correct readiness percentage', () => {
      const mockStory: UserStory = {
        id: 'story-1',
        title: 'Test Story',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: true },
            { label: 'Item 3', checked: false },
            { label: 'Item 4', checked: false },
          ]
        }
      } as UserStory;

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(50);
      expect(result.completedCount).toBe(2);
      expect(result.totalCount).toBe(4);
    });

    it('should return 0 for story without DoR', () => {
      const mockStory: UserStory = {
        id: 'story-1',
        title: 'Test Story',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
      } as UserStory;

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(0);
    });

    it('should return 100 for all completed', () => {
      const mockStory: UserStory = {
        id: 'story-1',
        title: 'Test Story',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: true },
          ]
        }
      } as UserStory;

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(100);
    });
  });

  describe('calculateCompletion', () => {
    it('should calculate correct completion percentage', () => {
      const mockStory: UserStory = {
        id: 'story-1',
        title: 'Test Story',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
        definition_of_done: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: false },
            { label: 'Item 3', checked: false },
          ]
        }
      } as UserStory;

      const result = calculateCompletion(mockStory);
      expect(result.percentage).toBe(33);
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
      expect(getConfidenceLevelLabel(0)).toBe('Very Low');
      expect(getConfidenceLevelLabel(6)).toBe('Very High');
    });
  });

  describe('getConfidenceLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getConfidenceLevelColor(1)).toContain('red');
      expect(getConfidenceLevelColor(2)).toContain('orange');
      expect(getConfidenceLevelColor(3)).toContain('yellow');
      expect(getConfidenceLevelColor(4)).toContain('green');
      expect(getConfidenceLevelColor(5)).toContain('green');
    });
  });
});
