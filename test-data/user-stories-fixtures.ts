import type { UserStory, Epic, Feature } from '@/hooks/useUserStories';
import type { GenerateStoryRequest, GenerateStoryResponse } from '@/types/ai-generation';

/**
 * Test fixtures for user stories with enhanced metadata
 */

export const mockUserStory: UserStory = {
  id: 'story-123',
  title: 'User Login',
  description: 'As a user, I want to log in to access my account',
  acceptance_criteria: [
    'User can enter email and password',
    'Valid credentials grant access',
    'Invalid credentials show error message',
  ],
  project_id: 'project-123',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  status: 'todo',
  priority: 'high',
  story_points: 5,
  user_persona: 'End User',
  business_objective: 'Improve platform security',
  user_value: 'Secure access to personal data',
  technical_notes: 'Implement JWT authentication with refresh tokens',
  dependencies: ['Authentication service', 'User database'],
  risks: ['Password complexity requirements', 'Rate limiting'],
  estimated_effort_hours: 8,
  business_value_score: 9,
  technical_complexity_score: 6,
  confidence_level: 4,
  definition_of_ready: [
    { item: 'User story is clearly defined', completed: true },
    { item: 'Acceptance criteria are testable', completed: true },
    { item: 'Dependencies are identified', completed: true },
    { item: 'Design mockups are available', completed: false },
    { item: 'Technical approach is defined', completed: true },
  ],
  definition_of_done: [
    { item: 'Code is written and reviewed', completed: false },
    { item: 'Unit tests pass', completed: false },
    { item: 'Integration tests pass', completed: false },
    { item: 'Documentation is updated', completed: false },
    { item: 'Acceptance criteria verified', completed: false },
    { item: 'Deployed to staging', completed: false },
  ],
};

export const mockEpic: Epic = {
  id: 'epic-123',
  title: 'User Management System',
  description: 'Complete system for managing user accounts, profiles, and permissions',
  project_id: 'project-123',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  status: 'in_progress',
  business_objective: 'Streamline user administration and improve security',
  success_metrics: [
    'User registration time < 2 minutes',
    'User satisfaction score > 90%',
    'Zero security incidents',
  ],
  estimated_effort_hours: 160,
  business_value_score: 10,
  confidence_level: 3,
};

export const mockFeature: Feature = {
  id: 'feature-123',
  title: 'User Registration',
  description: 'Allow new users to create accounts with email verification',
  epic_id: 'epic-123',
  project_id: 'project-123',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  status: 'in_progress',
  user_persona: 'New User',
  business_objective: 'Grow user base',
  success_metrics: [
    'Registration completion rate > 80%',
    'Email verification rate > 95%',
  ],
  estimated_effort_hours: 40,
  business_value_score: 8,
  technical_complexity_score: 5,
  confidence_level: 4,
};

export const mockGenerateStoryRequest: GenerateStoryRequest = {
  storyLevel: 'story',
  userInput: 'Create a user login feature with email and password',
  additionalFields: {
    userPersona: 'End User',
    businessObjective: 'Improve platform security',
    userValue: 'Secure access to personal data',
  },
  parentContext: {
    parentId: 'feature-123',
    parentType: 'feature',
    parentTitle: 'User Registration',
    parentDescription: 'Allow new users to create accounts',
  },
};

export const mockGenerateStoryResponse: GenerateStoryResponse = {
  story: {
    title: 'User Login with Email and Password',
    description:
      'As a user, I want to log in using my email and password so that I can securely access my account',
    acceptance_criteria: [
      'User can enter email and password in login form',
      'Valid credentials authenticate successfully',
      'Invalid credentials show clear error message',
      'Password is masked during input',
      'Login button is disabled until form is valid',
    ],
    user_persona: 'End User',
    business_objective: 'Improve platform security and user trust',
    user_value: 'Secure and convenient access to personal data',
    technical_notes:
      'Implement JWT-based authentication. Use bcrypt for password hashing. Add rate limiting to prevent brute force attacks.',
    dependencies: [
      'Authentication service API',
      'User database with encrypted passwords',
      'Email verification system',
    ],
    risks: [
      'Password complexity requirements may frustrate users',
      'Rate limiting could block legitimate users',
      'Session management complexity',
    ],
    estimated_effort_hours: 8,
    business_value_score: 9,
    technical_complexity_score: 6,
    confidence_level: 4,
    definition_of_ready: [
      { item: 'User story is clearly defined', completed: true },
      { item: 'Acceptance criteria are testable', completed: true },
      { item: 'Dependencies are identified', completed: true },
      { item: 'Design mockups are available', completed: false },
      { item: 'Technical approach is defined', completed: true },
    ],
    definition_of_done: [
      { item: 'Code is written and reviewed', completed: false },
      { item: 'Unit tests pass', completed: false },
      { item: 'Integration tests pass', completed: false },
      { item: 'Documentation is updated', completed: false },
      { item: 'Acceptance criteria verified', completed: false },
      { item: 'Deployed to staging', completed: false },
    ],
  },
  metadata: {
    generationTime: 2.5,
    tokenCount: 450,
    model: 'gpt-4-turbo',
  },
};

export const mockStoriesWithVariousStatuses: UserStory[] = [
  { ...mockUserStory, id: 'story-1', status: 'todo', priority: 'high' },
  {
    ...mockUserStory,
    id: 'story-2',
    status: 'in_progress',
    priority: 'medium',
    title: 'Password Reset',
  },
  {
    ...mockUserStory,
    id: 'story-3',
    status: 'done',
    priority: 'low',
    title: 'Profile Picture Upload',
  },
  {
    ...mockUserStory,
    id: 'story-4',
    status: 'blocked',
    priority: 'high',
    title: 'Two-Factor Authentication',
  },
];

export const mockStoriesWithVariousConfidenceLevels: UserStory[] = [
  { ...mockUserStory, id: 'story-1', confidence_level: 1, title: 'Complex AI Feature' },
  { ...mockUserStory, id: 'story-2', confidence_level: 2, title: 'Third-party Integration' },
  { ...mockUserStory, id: 'story-3', confidence_level: 3, title: 'Standard CRUD Operation' },
  { ...mockUserStory, id: 'story-4', confidence_level: 4, title: 'Simple UI Update' },
  { ...mockUserStory, id: 'story-5', confidence_level: 5, title: 'Text Change' },
];

export const mockRateLimitError = {
  error: {
    message: 'Rate limit exceeded. Please try again in 30 minutes.',
    details: {
      limitType: 'hourly',
      limit: 50,
      retryAfter: 1800,
    },
  },
};

export const mockAuditLog = {
  id: 'audit-123',
  user_id: 'user-123',
  story_level: 'story',
  input_data: mockGenerateStoryRequest,
  output_data: mockGenerateStoryResponse.story,
  token_count: 450,
  execution_time_ms: 2500,
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 (Test Browser)',
  created_at: '2023-01-01T00:00:00Z',
};
