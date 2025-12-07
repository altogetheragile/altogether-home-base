import { supabase } from '@/integrations/supabase/client';

const PROJECT_ID = 'ff42840b-18b0-43a2-bdd3-d9fa175150de';
const ARTIFACT_ID = '0c8075d5-a92c-4e19-b694-951de5200cab';

const backlogItems = [
  {
    title: 'Sprint Retrospective AI Facilitator',
    description: 'AI-powered facilitation for team retrospectives with prompts, summaries, and action items',
    priority: 'high',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.1',
    tags: ['ai', 'retrospective', 'scrum'],
    estimated_value: 8,
    estimated_effort: 5,
  },
  {
    title: 'Daily Standup Timer & Notes',
    description: 'Structured standup meetings with timer, participant tracking, and notes',
    priority: 'medium',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.2',
    tags: ['scrum', 'meetings'],
    estimated_value: 5,
    estimated_effort: 3,
  },
  {
    title: 'Estimation Poker Tool',
    description: 'Online planning poker for team estimation with real-time voting',
    priority: 'high',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.1',
    tags: ['estimation', 'scrum'],
    estimated_value: 7,
    estimated_effort: 5,
  },
  {
    title: 'Team Velocity Dashboard',
    description: 'Track and visualize team velocity across sprints with charts',
    priority: 'medium',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.2',
    tags: ['metrics', 'dashboard'],
    estimated_value: 6,
    estimated_effort: 4,
  },
  {
    title: 'Kanban Board View',
    description: 'Drag-and-drop Kanban board for visualizing backlog items',
    priority: 'high',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.1',
    tags: ['kanban', 'visualization'],
    estimated_value: 8,
    estimated_effort: 6,
  },
  {
    title: 'Definition of Done Checklist',
    description: 'Configurable DoD templates that can be attached to items',
    priority: 'medium',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.2',
    tags: ['quality', 'process'],
    estimated_value: 5,
    estimated_effort: 3,
  },
  {
    title: 'Release Planning Board',
    description: 'Plan releases with drag-drop items, capacity planning',
    priority: 'medium',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v1.3',
    tags: ['planning', 'releases'],
    estimated_value: 7,
    estimated_effort: 6,
  },
  {
    title: 'AI User Story Generator',
    description: 'Generate well-formed user stories from feature descriptions',
    priority: 'high',
    status: 'idea',
    source: 'AI Enhancement',
    target_release: 'v1.1',
    tags: ['ai', 'user-stories'],
    estimated_value: 9,
    estimated_effort: 4,
  },
  {
    title: 'Acceptance Criteria Builder',
    description: 'AI-assisted acceptance criteria with Given/When/Then format',
    priority: 'high',
    status: 'idea',
    source: 'AI Enhancement',
    target_release: 'v1.1',
    tags: ['ai', 'bdd', 'quality'],
    estimated_value: 8,
    estimated_effort: 4,
  },
  {
    title: 'Dependency Mapping',
    description: 'Visualize dependencies between backlog items',
    priority: 'low',
    status: 'idea',
    source: 'Enhancement',
    target_release: 'v2.0',
    tags: ['visualization', 'planning'],
    estimated_value: 6,
    estimated_effort: 7,
  },
];

export async function populateBacklogItems() {
  console.log('Starting backlog items population...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User must be authenticated to populate backlog items');
    return { success: false, error: 'Not authenticated' };
  }

  // Get max position for existing items
  const { data: existingItems } = await supabase
    .from('backlog_items')
    .select('backlog_position')
    .eq('project_id', PROJECT_ID)
    .order('backlog_position', { ascending: false })
    .limit(1);

  const startPosition = (existingItems?.[0]?.backlog_position ?? -1) + 1;

  // Insert all backlog items
  const itemsToInsert = backlogItems.map((item, index) => ({
    ...item,
    project_id: PROJECT_ID,
    created_by: user.id,
    backlog_position: startPosition + index,
  }));

  const { data: insertedItems, error: insertError } = await supabase
    .from('backlog_items')
    .insert(itemsToInsert)
    .select();

  if (insertError) {
    console.error('Failed to insert backlog items:', insertError);
    return { success: false, error: insertError.message };
  }

  console.log(`Successfully inserted ${insertedItems?.length} backlog items`);

  // Update the project artifact to sync
  const { data: allItems } = await supabase
    .from('backlog_items')
    .select('*')
    .eq('project_id', PROJECT_ID)
    .order('backlog_position', { ascending: true });

  if (allItems) {
    const artifactData = {
      items: allItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        source: item.source,
        target_release: item.target_release,
        tags: item.tags,
        estimated_value: item.estimated_value,
        estimated_effort: item.estimated_effort,
        backlog_position: item.backlog_position,
      })),
    };

    const { error: artifactError } = await supabase
      .from('project_artifacts')
      .update({ data: artifactData })
      .eq('id', ARTIFACT_ID);

    if (artifactError) {
      console.error('Failed to update artifact:', artifactError);
    } else {
      console.log('Successfully synced project artifact');
    }
  }

  return { success: true, count: insertedItems?.length };
}
