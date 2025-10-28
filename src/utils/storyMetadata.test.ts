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
        acceptanceCriteria: ['Valid credentials accepted', 'Invalid rejected'],
        userPersona: 'End User',
        problemStatement: 'Users need secure access',
        businessValue: 'Improve security',
        assumptionsRisks: 'Password complexity',
        technicalNotes: 'Use JWT tokens',
        dependencies: ['Authentication service'],
        storyType: 'feature',
        tags: ['auth', 'security'],
        storyPoints: 8,
        priority: 'High',
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
        customerJourneyStage: 'Onboarding',
        status: 'To Do',
      };

      const result = mapGeneratedStoryToUserStory(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Login',
        description: 'As a user, I want to log in',
        acceptance_criteria: ['Valid credentials accepted', 'Invalid rejected'],
        user_persona: 'End User',
        problem_statement: 'Users need secure access',
        business_value: 'Improve security',
        assumptions_risks: 'Password complexity',
        technical_notes: 'Use JWT tokens',
        story_points: 8,
        priority: 'high',
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
        businessObjective: 'Streamline operations',
        successMetrics: ['User satisfaction > 90%'],
        theme: 'User Management',
        stakeholders: ['Product', 'Engineering'],
        startDate: '2025-01-01',
        targetDate: '2025-06-30',
        status: 'draft',
      };

      const result = mapGeneratedEpicToEpic(generated, { projectId: 'project-123' });

      expect(result).toMatchObject({
        title: 'User Management System',
        description: 'Complete system for managing users',
        project_id: 'project-123',
        business_objective: 'Streamline operations',
        theme: 'User Management',
        status: 'draft',
      });

      expect(result.success_metrics).toEqual(['User satisfaction > 90%']);
    });
  });

  describe('calculateReadiness', () => {
    it('should calculate correct readiness percentage', () => {
      const story = {
        id: '1',
        title: 'Test',
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
      } as any;

      const result = calculateReadiness(story);
      expect(result.percentage).toBe(50);
      expect(result.completedCount).toBe(2);
      expect(result.totalCount).toBe(4);
    });

    it('should return 0 for undefined definition_of_ready', () => {
      const story = {
        id: '1',
        title: 'Test',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
      } as any;

      const result = calculateReadiness(story);
      expect(result.percentage).toBe(0);
    });

    it('should return 100 for all completed', () => {
      const story = {
        id: '1',
        title: 'Test',
        status: 'draft',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: true },
          ]
        }
      } as any;

      const result = calculateReadiness(story);
      expect(result.percentage).toBe(100);
    });
  });

  describe('calculateCompletion', () => {
    it('should calculate correct completion percentage', () => {
      const story = {
        id: '1',
        title: 'Test',
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
      } as any;

      const result = calculateCompletion(story);
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
      expect(getConfidenceLevelLabel(0)).toBe('Medium');
      expect(getConfidenceLevelLabel(6)).toBe('Medium');
    });
  });

  describe('getConfidenceLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getConfidenceLevelColor(1)).toBe('text-red-500');
      expect(getConfidenceLevelColor(2)).toBe('text-orange-500');
      expect(getConfidenceLevelColor(3)).toBe('text-yellow-500');
      expect(getConfidenceLevelColor(4)).toBe('text-green-500');
      expect(getConfidenceLevelColor(5)).toBe('text-green-600');
    });
  });

});
