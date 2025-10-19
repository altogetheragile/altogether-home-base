import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedStoryCard } from './EnhancedStoryCard';
import { AIGenerationButton } from './AIGenerationButton';
import { ImpactEffortMatrix } from './ImpactEffortMatrix';
import { DefinitionChecklistCard } from './DefinitionChecklistCard';
import { ConfidenceLevelBadge } from './ConfidenceLevelBadge';
import type { UserStory } from '@/hooks/useUserStories';
import type { GeneratedStory } from '@/types/ai-generation';
import { mapGeneratedStoryToUserStory } from '@/utils/storyMetadata';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Showcase component demonstrating all enhanced story metadata features
 * Use this as a reference for implementing the full feature set
 */
export function StoryMetadataShowcase() {
  // Sample story with rich metadata
  const [sampleStory, setSampleStory] = useState<UserStory>({
    id: 'sample-story-1',
    title: 'User can update their profile information',
    description: 'As a registered user, I want to update my profile information so that I can keep my account details current.',
    acceptance_criteria: [
      'Given I am logged in, when I navigate to my profile page, then I should see my current profile information',
      'Given I am on the profile page, when I update my email and click save, then my email should be updated',
      'Given I submit invalid data, when I try to save, then I should see appropriate error messages'
    ],
    story_points: 5,
    status: 'in_progress',
    priority: 'high',
    issue_type: 'story',
    user_persona: 'Registered User - Tech-Savvy Professional',
    problem_statement: 'Users need to keep their contact information up-to-date to receive important notifications and maintain account security.',
    business_value: 'Improves data accuracy, reduces support tickets related to outdated information, and enhances user trust.',
    assumptions_risks: 'Assumes users have verified their email. Risk: Email changes might affect authentication flows.',
    dependencies: ['Email verification service', 'User authentication system'],
    technical_notes: 'Use React Hook Form for validation. Implement debounced email uniqueness check. Update Auth0 user metadata.',
    design_notes: 'Follow Material Design patterns. Show inline validation. Provide clear success/error feedback.',
    story_type: 'feature',
    tags: ['profile', 'authentication', 'user-management'],
    confidence_level: 4,
    customer_journey_stage: 'Usage',
    sprint: 'Sprint 23',
    definition_of_ready: {
      items: [
        { label: 'Acceptance criteria defined', checked: true },
        { label: 'Dependencies identified', checked: true },
        { label: 'Story sized appropriately', checked: true },
        { label: 'User value is clear', checked: false }
      ]
    },
    definition_of_done: {
      items: [
        { label: 'Code reviewed and merged', checked: false },
        { label: 'Tests written and passing', checked: false },
        { label: 'Documentation updated', checked: false },
        { label: 'Acceptance criteria met', checked: false }
      ]
    },
    impact_effort_matrix: {
      impact: 7,
      effort: 5
    },
    evidence_links: [
      'https://docs.example.com/user-research',
      'https://analytics.example.com/profile-usage'
    ],
    non_functional_requirements: [
      'Profile update must complete within 2 seconds',
      'Email validation must prevent SQL injection',
      'Changes must be logged for audit purposes'
    ]
  });

  const handleAIGeneration = (data: GeneratedStory) => {
    const newStory = mapGeneratedStoryToUserStory(data);
    setSampleStory({ ...newStory, id: 'generated-story' } as UserStory);
  };

  const handleStoryUpdate = (updates: Partial<UserStory>) => {
    setSampleStory({ ...sampleStory, ...updates });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Enhanced Story Metadata</h1>
        <p className="text-muted-foreground">
          Comprehensive metadata system for rich story management
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Phase 6 Implementation Complete</AlertTitle>
        <AlertDescription>
          This showcase demonstrates all enhanced UI components including AI generation, 
          rich metadata panels, confidence levels, impact/effort analysis, and checklists.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="card" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="card">Enhanced Card</TabsTrigger>
          <TabsTrigger value="ai">AI Generation</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="matrix">Impact/Effort</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        {/* Enhanced Story Card */}
        <TabsContent value="card" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Story Card</CardTitle>
              <CardDescription>
                Complete story view with expandable metadata, progress tracking, and quick actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedStoryCard
                story={sampleStory}
                onUpdate={handleStoryUpdate}
                showMetadata={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generation */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Story Generation</CardTitle>
              <CardDescription>
                Generate rich stories with comprehensive metadata using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AIGenerationButton
                onGenerated={handleAIGeneration}
                variant="default"
                size="lg"
              />
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Click the button above to generate a new story with AI. The generated story will
                  include all rich metadata fields automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists */}
        <TabsContent value="checklists" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DefinitionChecklistCard
              title="Definition of Ready"
              description="Criteria before starting work"
              items={sampleStory.definition_of_ready?.items || []}
              onToggle={(index) => {
                const items = [...(sampleStory.definition_of_ready?.items || [])];
                items[index] = { ...items[index], checked: !items[index].checked };
                handleStoryUpdate({
                  definition_of_ready: { items }
                });
              }}
            />
            <DefinitionChecklistCard
              title="Definition of Done"
              description="Criteria for completion"
              items={sampleStory.definition_of_done?.items || []}
              onToggle={(index) => {
                const items = [...(sampleStory.definition_of_done?.items || [])];
                items[index] = { ...items[index], checked: !items[index].checked };
                handleStoryUpdate({
                  definition_of_done: { items }
                });
              }}
            />
          </div>
        </TabsContent>

        {/* Impact/Effort Matrix */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="max-w-2xl">
            <ImpactEffortMatrix
              impact={sampleStory.impact_effort_matrix?.impact}
              effort={sampleStory.impact_effort_matrix?.effort}
              onImpactChange={(value) => {
                handleStoryUpdate({
                  impact_effort_matrix: {
                    ...sampleStory.impact_effort_matrix,
                    impact: value
                  }
                });
              }}
              onEffortChange={(value) => {
                handleStoryUpdate({
                  impact_effort_matrix: {
                    ...sampleStory.impact_effort_matrix,
                    effort: value
                  }
                });
              }}
            />
          </div>
        </TabsContent>

        {/* Badges & Indicators */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Level Badges</CardTitle>
              <CardDescription>
                Visual indicators for story confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="space-y-2">
                    <ConfidenceLevelBadge level={level} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>
            How to use these components in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Import Components</h4>
            <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
{`import {
  EnhancedStoryCard,
  AIGenerationButton,
  StoryMetadataPanel,
  DefinitionChecklistCard,
  ConfidenceLevelBadge,
  ImpactEffortMatrix
} from '@/components/stories';`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Use Enhanced Story Card</h4>
            <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
{`<EnhancedStoryCard
  story={story}
  onUpdate={handleUpdate}
  showMetadata={true}
/>`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Add AI Generation</h4>
            <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
{`<AIGenerationButton
  onGenerated={(data, level) => {
    const story = mapGeneratedStoryToUserStory(data);
    createStory.mutate(story);
  }}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
