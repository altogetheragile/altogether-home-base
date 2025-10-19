# TypeScript Types Documentation

## AI Story Generation Types

### Overview
The AI story generation system supports hierarchical story creation following the Epic → Feature → Story → Task pattern.

### Core Types

#### `StoryLevel`
```typescript
type StoryLevel = 'epic' | 'feature' | 'story' | 'task';
```

#### `GenerateStoryRequest`
Request payload for the AI generation edge function:
```typescript
interface GenerateStoryRequest {
  storyLevel: StoryLevel;
  userInput: string;
  parentContext?: ParentContext;
  additionalFields?: AdditionalFields;
  parentId?: string;
}
```

#### `GenerateStoryResponse`
Response from the AI generation edge function:
```typescript
interface GenerateStoryResponse {
  success: boolean;
  data?: GeneratedStoryData;
  error?: string;
  metadata?: {
    level: StoryLevel;
    tokenCount: number;
    executionTime: number;
  };
}
```

### Rich Metadata Types

#### `UserStory` (Enhanced)
The UserStory interface now includes rich metadata fields:

**Core Fields:**
- `id`, `title`, `description`
- `acceptance_criteria`, `story_points`
- `status`, `priority`, `issue_type`
- `epic_id`, `feature_id`

**Rich Metadata:**
- `user_persona` - Target user type
- `problem_statement` - Problem being solved
- `business_value` - Business impact
- `assumptions_risks` - Key assumptions or risks
- `dependencies` - Array of dependency descriptions
- `technical_notes` - Technical approach
- `design_notes` - Design considerations
- `ui_mockup_url` - Link to mockups
- `definition_of_ready` - Checklist for story readiness
- `definition_of_done` - Checklist for completion
- `tags` - Classification tags
- `story_type` - Type of work (feature, spike, bug, chore, task)
- `sprint` - Sprint assignment
- `impact_effort_matrix` - Impact/effort scoring
- `evidence_links` - Links to research/evidence
- `non_functional_requirements` - Performance, security, etc.
- `customer_journey_stage` - Stage in user journey
- `confidence_level` - Confidence in estimates (1-5)

#### `Epic` (Enhanced)
Additional fields for strategic planning:
- `business_objective` - Strategic business goal
- `success_metrics` - Measurable outcomes
- `stakeholders` - Key people/teams
- `start_date`, `target_date` - Timeline
- `project_id` - Associated project

#### `Feature` (Enhanced)
Additional fields for feature definition:
- `user_value` - Primary user benefit
- `acceptance_criteria` - High-level criteria
- `status` - Current status (draft, in_progress, completed)
- `project_id` - Associated project

## Usage Examples

### 1. Using the AI Generation Hook

```typescript
import { useAIStoryGeneration } from '@/hooks/useAIStoryGeneration';

function StoryGenerator() {
  const { generateStory, isGenerating, data } = useAIStoryGeneration();

  const handleGenerate = () => {
    generateStory({
      storyLevel: 'story',
      userInput: 'User login functionality',
      additionalFields: {
        userRole: 'registered user',
        context: 'E-commerce platform'
      }
    });
  };

  return (
    <button onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? 'Generating...' : 'Generate Story'}
    </button>
  );
}
```

### 2. Converting AI Output to Database Format

```typescript
import { mapGeneratedStoryToUserStory } from '@/utils/storyMetadata';
import { useStoryMutations } from '@/hooks/useUserStories';

function StoryCreator() {
  const { createStory } = useStoryMutations();
  const { generateStory, data } = useAIStoryGeneration();

  const handleGenerateAndSave = async () => {
    const result = await generateStory({
      storyLevel: 'story',
      userInput: 'Shopping cart feature'
    });

    if (result?.data) {
      const storyData = mapGeneratedStoryToUserStory(
        result.data as GeneratedStory,
        { epicId: 'epic-123' }
      );
      
      createStory.mutate(storyData);
    }
  };
}
```

### 3. Working with Definition of Ready/Done

```typescript
import { 
  calculateReadiness, 
  calculateCompletion,
  DEFAULT_DEFINITION_OF_READY 
} from '@/utils/storyMetadata';

function StoryProgress({ story }: { story: UserStory }) {
  const readiness = calculateReadiness(story);
  const completion = calculateCompletion(story);

  return (
    <div>
      <div>Readiness: {readiness.percentage}%</div>
      <div>Completion: {completion.percentage}%</div>
    </div>
  );
}
```

### 4. Validating Story Data

```typescript
import { validateStoryLevel } from '@/utils/storyMetadata';

function validateBeforeSave(story: Partial<UserStory>) {
  const validation = validateStoryLevel('story', story);
  
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return false;
  }
  
  return true;
}
```

## Database Schema Alignment

All TypeScript interfaces align with the Supabase database schema:

### Tables
- `user_stories` → `UserStory` interface
- `epics` → `Epic` interface
- `features` → `Feature` interface
- `ai_generation_audit` → `AIGenerationAudit` interface
- `ai_rate_limits` → (internal, managed by edge function)

### Edge Functions
- `generate-user-story` - Main AI generation endpoint
  - Requires authentication
  - Rate limited to 50 requests/hour
  - Logs all requests to audit table

## Security Features

### Rate Limiting
- 50 requests per hour per user
- Tracked in `ai_rate_limits` table
- Returns 429 status when exceeded

### Audit Logging
- All generation requests logged to `ai_generation_audit`
- Includes input, output, token count, execution time
- Tracks IP address and user agent
- Admins can view all logs, users can view their own

### Input Validation
- Sanitizes user input to prevent injection
- Validates required fields per story level
- Token limit enforcement (max 3500 tokens)
- Parent validation for child levels

## Best Practices

1. **Always use type imports from `@/types`:**
   ```typescript
   import type { UserStory, GenerateStoryRequest } from '@/types';
   ```

2. **Use utility functions for data transformation:**
   ```typescript
   import { mapGeneratedStoryToUserStory } from '@/utils/storyMetadata';
   ```

3. **Handle rate limiting gracefully:**
   ```typescript
   const { generateStory, error } = useAIStoryGeneration();
   // Hook automatically shows toast on rate limit
   ```

4. **Validate data before database operations:**
   ```typescript
   const validation = validateStoryLevel('story', storyData);
   if (!validation.valid) {
     // Handle validation errors
   }
   ```

5. **Use type guards for metadata:**
   ```typescript
   if ('user_persona' in story && story.user_persona) {
     // Safe to use user_persona
   }
   ```
