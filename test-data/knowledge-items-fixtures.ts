export interface KnowledgeItemFixture {
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  level?: 'beginner' | 'intermediate' | 'advanced';
  planning_focus?: string;
  use_cases?: Array<{
    title: string;
    description: string;
    context: string;
    outcome: string;
  }>;
}

export const knowledgeItemsFixtures: KnowledgeItemFixture[] = [
  {
    name: 'Scrum Framework Overview',
    description: 'A comprehensive guide to the Scrum framework for agile development',
    content: `
      # Scrum Framework Overview
      
      Scrum is an agile framework for developing, delivering, and sustaining complex products.
      
      ## Key Components
      
      - **Sprint**: Time-boxed iterations (1-4 weeks)
      - **Product Backlog**: Prioritized list of features
      - **Sprint Backlog**: Items selected for the current sprint
      - **Increment**: Potentially shippable product increment
      
      ## Scrum Events
      
      1. Sprint Planning
      2. Daily Scrum
      3. Sprint Review
      4. Sprint Retrospective
    `,
    category: 'Agile Frameworks',
    tags: ['scrum', 'agile', 'framework', 'sprint'],
    status: 'published',
    level: 'intermediate',
    planning_focus: 'Team Management',
    use_cases: [
      {
        title: 'Sprint Planning Meeting',
        description: 'Use this guide to facilitate effective sprint planning sessions',
        context: 'When starting a new sprint with your development team',
        outcome: 'A well-planned sprint with clear goals and committed work'
      }
    ]
  },
  {
    name: 'Kanban Method',
    description: 'Understanding the Kanban method for workflow management',
    content: `
      # Kanban Method
      
      Kanban is a visual method for managing work as it moves through a process.
      
      ## Core Principles
      
      - Visualize work
      - Limit work in progress
      - Manage flow
      - Make policies explicit
      - Implement feedback loops
      - Improve collaboratively
    `,
    category: 'Agile Frameworks',
    tags: ['kanban', 'workflow', 'visualization'],
    status: 'published',
    level: 'beginner',
    planning_focus: 'Process Optimization'
  },
  {
    name: 'User Story Writing Guide',
    description: 'How to write effective user stories for agile development',
    content: `
      # User Story Writing Guide
      
      User stories are short descriptions of features from the user's perspective.
      
      ## Template
      
      As a [user type], I want [functionality] so that [benefit].
      
      ## Acceptance Criteria
      
      - Clear and testable conditions
      - Defines "done" for the story
      - Usually written in Given-When-Then format
    `,
    category: 'Requirements Management',
    tags: ['user-stories', 'requirements', 'backlog'],
    status: 'draft',
    level: 'intermediate',
    planning_focus: 'Requirements Analysis'
  },
  {
    name: 'Retrospective Techniques',
    description: 'Various techniques for conducting effective retrospectives',
    content: `
      # Retrospective Techniques
      
      Collection of proven techniques for team retrospectives.
      
      ## What Went Well / What Could Be Better
      
      Simple two-column format for team reflection.
      
      ## Starfish (Start, Stop, Continue, More, Less)
      
      Five categories for more nuanced feedback.
      
      ## 4Ls (Liked, Learned, Lacked, Longed For)
      
      Focus on learning and desires for improvement.
    `,
    category: 'Team Facilitation',
    tags: ['retrospective', 'facilitation', 'improvement'],
    status: 'published',
    level: 'advanced',
    planning_focus: 'Team Development'
  }
];

export const createTestKnowledgeItem = (overrides: Partial<KnowledgeItemFixture> = {}): KnowledgeItemFixture => {
  return {
    name: 'Test Knowledge Item',
    description: 'A test knowledge item for BDD scenarios',
    content: 'This is test content for the knowledge item.',
    category: 'Testing',
    tags: ['test', 'bdd'],
    status: 'draft',
    level: 'beginner',
    planning_focus: 'Testing',
    ...overrides
  };
};

export const categories = [
  'Agile Frameworks',
  'Requirements Management', 
  'Team Facilitation',
  'Process Optimization',
  'Testing',
  'Project Management'
];

export const planningFocuses = [
  'Team Management',
  'Process Optimization', 
  'Requirements Analysis',
  'Team Development',
  'Testing',
  'Strategic Planning'
];