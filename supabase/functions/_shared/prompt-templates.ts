/**
 * Modular Prompt Templates for Hierarchical Story Generation
 * Supports Epic → Feature → Story → Task generation with context awareness
 */

export type StoryLevel = 'epic' | 'feature' | 'story' | 'task';

export interface PromptContext {
  storyLevel: StoryLevel;
  userInput: string;
  parentContext?: {
    level: StoryLevel;
    title: string;
    description?: string;
    businessObjective?: string;
    userValue?: string;
  };
  additionalFields?: {
    userRole?: string;
    goal?: string;
    context?: string;
  };
}

/**
 * Build an Epic generation prompt
 * Epics are high-level business initiatives with strategic goals
 */
export function buildEpicPrompt(context: PromptContext): string {
  const { userInput, additionalFields } = context;
  
  return `Generate a comprehensive Epic for the following business initiative:

Initiative: ${userInput}
${additionalFields?.context ? `Additional Context: ${additionalFields.context}` : ''}

An Epic represents a large body of work that can be broken down into smaller Features. Please create a strategic Epic with:

1. **Title**: Clear, outcome-focused title (max 60 chars)
2. **Description**: 2-3 sentence overview of what this Epic achieves and why it matters
3. **Business Objective**: The core business goal this Epic addresses
4. **Success Metrics**: 3-5 measurable outcomes that define success (e.g., "Increase user retention by 20%")
5. **Theme**: The strategic theme or category (e.g., "Customer Experience", "Platform Scalability")
6. **Stakeholders**: Key people/teams involved (e.g., ["Product Team", "Engineering", "Marketing"])
7. **Timeline**: Suggested start_date and target_date (ISO format YYYY-MM-DD)
8. **Status**: Initial status (typically "draft")

Return a JSON object with this structure:
{
  "title": "Epic title",
  "description": "What this epic achieves",
  "businessObjective": "The strategic business goal",
  "successMetrics": ["Metric 1", "Metric 2", "Metric 3"],
  "theme": "Strategic theme",
  "stakeholders": ["Stakeholder 1", "Stakeholder 2"],
  "startDate": "2025-01-15",
  "targetDate": "2025-06-30",
  "status": "draft"
}`;
}

/**
 * Build a Feature generation prompt
 * Features are deliverable capabilities within an Epic
 */
export function buildFeaturePrompt(context: PromptContext): string {
  const { userInput, parentContext, additionalFields } = context;
  
  const epicContext = parentContext ? `
Parent Epic: ${parentContext.title}
Epic Goal: ${parentContext.businessObjective || parentContext.description || 'Not specified'}
` : '';

  return `Generate a Feature for the following capability:

Feature Request: ${userInput}
${epicContext}
${additionalFields?.context ? `Additional Context: ${additionalFields.context}` : ''}

A Feature is a deliverable capability that provides value to users. It should be sizeable enough to warrant multiple User Stories. Please create a well-defined Feature with:

1. **Title**: Clear, user-focused title describing the capability
2. **Description**: 2-3 sentences explaining what this feature does and how it helps users
3. **User Value**: The primary value/benefit users gain from this feature
4. **Acceptance Criteria**: 4-6 high-level criteria that define when this feature is complete (use Given-When-Then format)
5. **Epic Link**: Reference to parent epic if provided
6. **Status**: Initial status ("draft", "in_progress", "completed")
7. **Priority**: Business priority (High, Medium, Low)

Return a JSON object with this structure:
{
  "title": "Feature title",
  "description": "What this feature does",
  "userValue": "Why users need this",
  "acceptanceCriteria": [
    "Given... When... Then...",
    "Given... When... Then..."
  ],
  "epicId": "${parentContext?.title || 'none'}",
  "status": "draft",
  "priority": "Medium"
}`;
}

/**
 * Build a User Story generation prompt
 * User Stories are specific, testable requirements from a user's perspective
 */
export function buildStoryPrompt(context: PromptContext): string {
  const { userInput, parentContext, additionalFields } = context;
  
  const featureContext = parentContext ? `
Parent Feature: ${parentContext.title}
Feature Value: ${parentContext.userValue || parentContext.description || 'Not specified'}
` : '';

  const userRole = additionalFields?.userRole || 'user';
  const goal = additionalFields?.goal || '';

  return `Generate a comprehensive User Story for the following requirement:

Requirement: ${userInput}
${featureContext}
User Role: ${userRole}
${goal ? `Goal: ${goal}` : ''}
${additionalFields?.context ? `Context: ${additionalFields.context}` : ''}

A User Story describes a specific feature from an end user's perspective. Please create a rich, detailed User Story with:

**Core Fields:**
1. **Title**: Brief, descriptive title (max 60 chars)
2. **Story**: Proper "As a [user], I want [feature], so that [benefit]" format
3. **Acceptance Criteria**: 3-5 testable Given-When-Then statements
4. **Priority**: Business priority (High, Medium, Low)
5. **Story Points**: Complexity estimate (1, 2, 3, 5, 8, 13)

**Context Fields:**
6. **User Persona**: Target user type or segment
7. **Problem Statement**: The specific problem this story solves
8. **Business Value**: Business impact and value proposition
9. **Assumptions/Risks**: 2-3 key assumptions or potential risks

**Implementation Fields:**
10. **Technical Notes**: Brief technical considerations or approaches
11. **Dependencies**: Other stories or systems this depends on
12. **Story Type**: Type of work (feature, spike, bug, chore, task)

**Metadata:**
13. **Tags**: 3-5 relevant tags (e.g., ["frontend", "search", "high-value"])
14. **Definition of Ready**: 3-4 checklist items needed before work starts
15. **Definition of Done**: 3-4 checklist items needed for completion
16. **Confidence Level**: Confidence in estimates (1-5, where 5 is highest)
17. **Customer Journey Stage**: Stage in user journey (e.g., "Discovery", "Onboarding", "Usage")

Return a JSON object with this structure:
{
  "title": "Story title",
  "story": "As a [role], I want [feature] so that [benefit]",
  "acceptanceCriteria": ["Given... When... Then...", "..."],
  "priority": "High|Medium|Low",
  "storyPoints": 5,
  "userPersona": "Target user type",
  "problemStatement": "The problem being solved",
  "businessValue": "Why this matters to the business",
  "assumptionsRisks": "Key assumptions or risks",
  "technicalNotes": "Technical approach or considerations",
  "dependencies": ["Dependency 1", "Dependency 2"],
  "storyType": "feature",
  "tags": ["tag1", "tag2", "tag3"],
  "definitionOfReady": {
    "items": [
      {"label": "Acceptance criteria defined", "checked": false},
      {"label": "Dependencies identified", "checked": false}
    ]
  },
  "definitionOfDone": {
    "items": [
      {"label": "Code reviewed and merged", "checked": false},
      {"label": "Tests written and passing", "checked": false}
    ]
  },
  "confidenceLevel": 4,
  "customerJourneyStage": "Usage",
  "status": "To Do"
}`;
}

/**
 * Build a Task generation prompt
 * Tasks are granular, implementable work items
 */
export function buildTaskPrompt(context: PromptContext): string {
  const { userInput, parentContext, additionalFields } = context;
  
  const storyContext = parentContext ? `
Parent Story: ${parentContext.title}
Story Description: ${parentContext.description || 'Not specified'}
` : '';

  return `Generate a Task for the following work item:

Task: ${userInput}
${storyContext}
${additionalFields?.context ? `Additional Context: ${additionalFields.context}` : ''}

A Task is a small, concrete piece of work that can be completed in a few hours. Please create a specific, actionable Task with:

1. **Title**: Clear, action-oriented title (starts with verb)
2. **Description**: 2-3 sentences describing exactly what needs to be done
3. **Technical Notes**: Specific implementation details, file paths, or code changes
4. **Estimated Hours**: Time estimate (0.5, 1, 2, 4, 8 hours)
5. **Story Type**: Always "task"
6. **Status**: Initial status ("To Do")
7. **Acceptance Criteria**: 2-3 simple, verifiable completion criteria

Return a JSON object with this structure:
{
  "title": "Task title (action-oriented)",
  "description": "Specific work to be done",
  "technicalNotes": "Implementation details",
  "storyPoints": 1,
  "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
  "storyType": "task",
  "status": "To Do",
  "priority": "Medium"
}`;
}

/**
 * Main prompt builder that routes to the appropriate level-specific builder
 */
export function buildPrompt(context: PromptContext): string {
  switch (context.storyLevel) {
    case 'epic':
      return buildEpicPrompt(context);
    case 'feature':
      return buildFeaturePrompt(context);
    case 'story':
      return buildStoryPrompt(context);
    case 'task':
      return buildTaskPrompt(context);
    default:
      throw new Error(`Unknown story level: ${context.storyLevel}`);
  }
}

/**
 * Get system prompt based on story level
 * This provides context to the AI about its role
 */
export function getSystemPrompt(storyLevel: StoryLevel): string {
  const roleMap: Record<StoryLevel, string> = {
    epic: 'You are a strategic product leader creating high-level business initiatives. Focus on business outcomes, measurable success, and stakeholder alignment.',
    feature: 'You are an experienced product manager defining user-facing capabilities. Focus on user value, clear acceptance criteria, and feature scope.',
    story: 'You are an expert agile coach and product owner. Create detailed, well-structured user stories with comprehensive metadata. Focus on testable acceptance criteria, risk identification, and implementation guidance.',
    task: 'You are a technical lead breaking down work into implementable tasks. Focus on specific, actionable work items with clear technical details.'
  };

  return `${roleMap[storyLevel]} Always respond with valid JSON only. Do not include any text before or after the JSON object.`;
}
