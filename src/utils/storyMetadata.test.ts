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
        technicalNotes: 'Use JWT tokens',
        dependencies: ['Authentication service'],
        businessValue: 'High value for user security',
        confidenceLevel: 4,
        priority: 'High',
        storyPoints: 5,
        problemStatement: 'Users need secure access to the system',
        assumptionsRisks: 'Assumes users have valid credentials',
        storyType: 'feature',
        tags: ['security', 'authentication'],
        customerJourneyStage: 'onboarding',
        status: 'To Do',
        definitionOfReady: {
          items: [
            { label: 'Requirements clear', checked: true },
            { label: 'Design approved', checked: false },
          ],
        },
        definitionOfDone: {
          items: [
            { label: 'Tests written', checked: false },
            { label: 'Code reviewed', checked: false },
          ],
        },
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
        successMetrics: ['User satisfaction > 90%'],
        theme: 'User Management',
        stakeholders: ['Product Team', 'Engineering'],
        startDate: '2024-01-01',
        targetDate: '2024-06-01',
        status: 'draft',
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
      const mockStory: any = {
        id: 'test-1',
        title: 'Test Story',
        status: 'backlog',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: true },
            { label: 'Item 3', checked: false },
            { label: 'Item 4', checked: false },
          ],
        },
      };

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(50);
      expect(result.completedCount).toBe(2);
      expect(result.totalCount).toBe(4);
    });

    it('should return 0 for no items', () => {
      const mockStory: any = {
        id: 'test-2',
        title: 'Test Story',
        status: 'backlog',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: { items: [] },
      };

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(0);
    });

    it('should return 100 for all completed', () => {
      const mockStory: any = {
        id: 'test-3',
        title: 'Test Story',
        status: 'backlog',
        priority: 'medium',
        issue_type: 'story',
        definition_of_ready: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: true },
          ],
        },
      };

      const result = calculateReadiness(mockStory);
      expect(result.percentage).toBe(100);
    });
  });

  describe('calculateCompletion', () => {
    it('should calculate correct completion percentage', () => {
      const mockStory: any = {
        id: 'test-4',
        title: 'Test Story',
        status: 'in_progress',
        priority: 'medium',
        issue_type: 'story',
        definition_of_done: {
          items: [
            { label: 'Item 1', checked: true },
            { label: 'Item 2', checked: false },
            { label: 'Item 3', checked: false },
          ],
        },
      };

      const result = calculateCompletion(mockStory);
      expect(result.percentage).toBe(33);
      expect(result.completedCount).toBe(1);
      expect(result.totalCount).toBe(3);
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
