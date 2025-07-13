// Simple Node.js script to populate test data
// Run with: node scripts/populate-test-data.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://wqaplkypnetifpqrungv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYXBsa3lwbmV0aWZwcXJ1bmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODg2OTUsImV4cCI6MjA2NDg2NDY5NX0.sE0cIatVX-tynJ7Z5dGp4L6f4-SA0s9KWU3WYtVoDzM";

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: 'Facilitation Techniques', slug: 'facilitation-techniques', description: 'Methods for guiding group processes and discussions', color: '#3B82F6' },
  { name: 'Strategy Development', slug: 'strategy-development', description: 'Frameworks for creating and refining strategic plans', color: '#10B981' },
  { name: 'Team Building', slug: 'team-building', description: 'Activities and methods to strengthen team dynamics', color: '#F59E0B' },
  { name: 'Problem Solving', slug: 'problem-solving', description: 'Systematic approaches to identifying and solving challenges', color: '#EF4444' },
  { name: 'Innovation Methods', slug: 'innovation-methods', description: 'Techniques for fostering creativity and innovation', color: '#8B5CF6' },
  { name: 'Assessment Tools', slug: 'assessment-tools', description: 'Methods for evaluating progress and outcomes', color: '#06B6D4' }
];

const tags = [
  { name: 'Brainstorming', slug: 'brainstorming' },
  { name: 'Decision Making', slug: 'decision-making' },
  { name: 'Communication', slug: 'communication' },
  { name: 'Leadership', slug: 'leadership' },
  { name: 'Collaboration', slug: 'collaboration' },
  { name: 'Planning', slug: 'planning' },
  { name: 'Retrospective', slug: 'retrospective' },
  { name: 'Ideation', slug: 'ideation' },
  { name: 'Prioritization', slug: 'prioritization' },
  { name: 'Feedback', slug: 'feedback' },
  { name: 'Consensus', slug: 'consensus' },
  { name: 'Analysis', slug: 'analysis' },
  { name: 'Design Thinking', slug: 'design-thinking' },
  { name: 'Agile', slug: 'agile' },
  { name: 'Lean', slug: 'lean' },
  { name: 'Visual', slug: 'visual' },
  { name: 'Interactive', slug: 'interactive' },
  { name: 'Remote', slug: 'remote' },
  { name: 'Workshop', slug: 'workshop' },
  { name: 'Meeting', slug: 'meeting' }
];

const techniques = [
  {
    name: 'SWOT Analysis',
    slug: 'swot-analysis',
    purpose: 'Evaluate internal strengths and weaknesses alongside external opportunities and threats',
    description: 'SWOT Analysis is a strategic planning technique used to help organizations identify their internal strengths and weaknesses, as well as external opportunities and threats. This framework provides a comprehensive view of the current situation and helps in developing strategies that leverage strengths, address weaknesses, capitalize on opportunities, and mitigate threats.',
    summary: 'Strategic framework for analyzing internal and external factors affecting an organization',
    difficulty_level: 'Beginner',
    estimated_reading_time: 8,
    is_published: true,
    is_featured: true,
    content_type: 'technique'
  },
  {
    name: 'Design Thinking Workshop',
    slug: 'design-thinking-workshop',
    purpose: 'Foster human-centered innovation through empathy, ideation, and experimentation',
    description: 'Design Thinking is a methodology that provides a solution-based approach to solving problems. It\'s a way of thinking and working as well as a collection of hands-on methods. This workshop format guides teams through the five stages: Empathize, Define, Ideate, Prototype, and Test.',
    summary: 'Human-centered approach to innovation that integrates people, technology, and business',
    difficulty_level: 'Intermediate',
    estimated_reading_time: 12,
    is_published: true,
    is_featured: true,
    content_type: 'technique'
  },
  {
    name: 'Retrospective Meeting',
    slug: 'retrospective-meeting',
    purpose: 'Reflect on team performance and identify improvements for future iterations',
    description: 'A retrospective is a meeting held by a project team at the end of a project or process to discuss what was successful about the project, what could be improved, and how to incorporate the successes and improvements in future iterations.',
    summary: 'Team reflection process to identify what worked well and what can be improved',
    difficulty_level: 'Beginner',
    estimated_reading_time: 6,
    is_published: true,
    content_type: 'technique'
  },
  {
    name: 'Dot Voting',
    slug: 'dot-voting',
    purpose: 'Quickly gauge group preferences and priorities through visual voting',
    description: 'Dot voting is a simple tool used to democratically prioritize options. Participants are given a limited number of votes (often in the form of stickers or dots) and asked to place them on their preferred options. This method is particularly useful for narrowing down a large list of ideas.',
    summary: 'Visual voting method for quick group prioritization and decision making',
    difficulty_level: 'Beginner',
    estimated_reading_time: 4,
    is_published: true,
    content_type: 'technique'
  },
  {
    name: 'World Café Method',
    slug: 'world-cafe-method',
    purpose: 'Enable large group conversations through small table discussions',
    description: 'The World Café is a structured conversational process for knowledge sharing in which groups of people discuss a topic at several tables, with individuals switching tables periodically and getting introduced to the previous discussion at their new table by a "table host".',
    summary: 'Conversational method for engaging large groups in meaningful dialogue',
    difficulty_level: 'Advanced',
    estimated_reading_time: 15,
    is_published: true,
    content_type: 'technique'
  }
];

async function populateData() {
  console.log('🚀 Starting test data population...');

  try {
    // Insert categories
    console.log('📁 Inserting categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('knowledge_categories')
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`✅ Inserted ${categoriesData.length} categories`);

    // Insert tags
    console.log('🏷️ Inserting tags...');
    const { data: tagsData, error: tagsError } = await supabase
      .from('knowledge_tags')
      .upsert(tags, { onConflict: 'slug' })
      .select();

    if (tagsError) throw tagsError;
    console.log(`✅ Inserted ${tagsData.length} tags`);

    // Insert techniques
    console.log('📝 Inserting techniques...');
    for (const technique of techniques) {
      // Find category ID by matching names
      const category = categoriesData.find(c => {
        if (technique.name === 'SWOT Analysis' || technique.name === 'Lean Canvas') {
          return c.slug === 'strategy-development';
        } else if (technique.name === 'Design Thinking Workshop' || technique.name === 'Rapid Prototyping') {
          return c.slug === 'innovation-methods';
        } else if (technique.name === 'Retrospective Meeting' || technique.name === 'Team Health Check') {
          return c.slug === 'team-building';
        } else if (technique.name === 'Dot Voting' || technique.name === 'World Café Method') {
          return c.slug === 'facilitation-techniques';
        } else if (technique.name === 'Root Cause Analysis' || technique.name === 'Fishbone Diagram') {
          return c.slug === 'problem-solving';
        }
        return c.slug === 'assessment-tools';
      });

      if (!category) {
        console.warn(`Category not found for technique: ${technique.name}`);
        continue;
      }

      // Insert technique
      const { data: techniqueResult, error: techniqueError } = await supabase
        .from('knowledge_techniques')
        .upsert({
          ...technique,
          category_id: category.id
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (techniqueError) {
        console.error(`Error inserting technique ${technique.name}:`, techniqueError);
        continue;
      }

      console.log(`✅ Inserted technique: ${technique.name}`);
    }

    console.log('🎉 Test data population completed!');
    console.log('💡 Navigate to /knowledge to see the populated techniques');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

populateData();