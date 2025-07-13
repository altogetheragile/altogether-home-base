import { supabase } from '@/integrations/supabase/client';

// Test data for populating the knowledge base
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
    content_type: 'technique',
    category_slug: 'strategy-development',
    tag_slugs: ['analysis', 'planning', 'decision-making']
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
    content_type: 'technique',
    category_slug: 'innovation-methods',
    tag_slugs: ['design-thinking', 'ideation', 'workshop', 'collaboration']
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
    content_type: 'technique',
    category_slug: 'team-building',
    tag_slugs: ['retrospective', 'feedback', 'agile', 'collaboration']
  },
  {
    name: 'Root Cause Analysis',
    slug: 'root-cause-analysis',
    purpose: 'Identify the fundamental cause of problems to prevent recurrence',
    description: 'Root Cause Analysis (RCA) is a problem-solving method used for identifying the root causes of faults or problems. It is based on the belief that problems are best solved by attempting to correct or eliminate root causes, as opposed to merely addressing the immediately obvious symptoms.',
    summary: 'Systematic approach to identifying the underlying causes of problems',
    difficulty_level: 'Intermediate',
    estimated_reading_time: 10,
    is_published: true,
    content_type: 'technique',
    category_slug: 'problem-solving',
    tag_slugs: ['analysis', 'problem-solving', 'decision-making']
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
    content_type: 'technique',
    category_slug: 'facilitation-techniques',
    tag_slugs: ['prioritization', 'decision-making', 'visual', 'interactive']
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
    content_type: 'technique',
    category_slug: 'facilitation-techniques',
    tag_slugs: ['facilitation', 'communication', 'collaboration', 'workshop']
  },
  {
    name: 'Lean Canvas',
    slug: 'lean-canvas',
    purpose: 'Quickly capture business model assumptions on a single page',
    description: 'The Lean Canvas is a 1-page business plan template that helps you deconstruct your idea into its key assumptions. It is adapted from Alex Osterwalder\'s Business Model Canvas and optimized for Lean Startups. It replaces elaborate business plans with a single page business model.',
    summary: 'One-page business model planning tool based on lean startup principles',
    difficulty_level: 'Intermediate',
    estimated_reading_time: 9,
    is_published: true,
    content_type: 'technique',
    category_slug: 'strategy-development',
    tag_slugs: ['lean', 'planning', 'visual', 'analysis']
  },
  {
    name: 'Fishbone Diagram',
    slug: 'fishbone-diagram',
    purpose: 'Visually map potential causes of a problem for systematic analysis',
    description: 'Also known as the Ishikawa diagram or cause-and-effect diagram, the fishbone diagram is a visualization tool for categorizing the potential causes of a problem in order to identify its root causes. It gets its name from its resemblance to a fish skeleton.',
    summary: 'Visual problem-solving tool that maps potential causes in a fishbone structure',
    difficulty_level: 'Beginner',
    estimated_reading_time: 7,
    is_published: true,
    content_type: 'technique',
    category_slug: 'problem-solving',
    tag_slugs: ['visual', 'analysis', 'problem-solving', 'planning']
  },
  {
    name: 'Team Health Check',
    slug: 'team-health-check',
    purpose: 'Assess team dynamics and identify areas for improvement',
    description: 'A Team Health Check is a regular assessment activity that helps teams reflect on how they are working together, identify strengths and areas for improvement, and create action plans to enhance team effectiveness. It typically covers areas like communication, collaboration, goals, and team culture.',
    summary: 'Regular assessment tool for evaluating and improving team performance',
    difficulty_level: 'Intermediate',
    estimated_reading_time: 11,
    is_published: true,
    content_type: 'technique',
    category_slug: 'assessment-tools',
    tag_slugs: ['assessment', 'team-building', 'feedback', 'collaboration']
  },
  {
    name: 'Rapid Prototyping',
    slug: 'rapid-prototyping',
    purpose: 'Quickly build and test ideas to validate concepts early',
    description: 'Rapid prototyping is a group of techniques used to quickly fabricate a scale model of a physical part or assembly using three-dimensional computer-aided design data. In business and innovation contexts, it refers to quickly building testable versions of ideas or solutions.',
    summary: 'Fast iteration method for building and testing ideas before full development',
    difficulty_level: 'Advanced',
    estimated_reading_time: 13,
    is_published: true,
    content_type: 'technique',
    category_slug: 'innovation-methods',
    tag_slugs: ['ideation', 'design-thinking', 'interactive', 'collaboration']
  }
];

export async function populateTestData() {
  console.log('Starting test data population...');

  try {
    // 1. Insert categories
    console.log('Inserting categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('knowledge_categories')
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`Inserted ${categoriesData.length} categories`);

    // 2. Insert tags
    console.log('Inserting tags...');
    const { data: tagsData, error: tagsError } = await supabase
      .from('knowledge_tags')
      .upsert(tags, { onConflict: 'slug' })
      .select();

    if (tagsError) throw tagsError;
    console.log(`Inserted ${tagsData.length} tags`);

    // 3. Insert techniques
    console.log('Inserting techniques...');
    for (const technique of techniques) {
      const { category_slug, tag_slugs, ...techniqueData } = technique;
      
      // Find category ID
      const category = categoriesData.find(c => c.slug === category_slug);
      if (!category) {
        console.warn(`Category not found for slug: ${category_slug}`);
        continue;
      }

      // Insert technique
      const { data: techniqueResult, error: techniqueError } = await supabase
        .from('knowledge_techniques')
        .upsert({
          ...techniqueData,
          category_id: category.id
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (techniqueError) {
        console.error(`Error inserting technique ${technique.name}:`, techniqueError);
        continue;
      }

      // Link tags
      for (const tagSlug of tag_slugs) {
        const tag = tagsData.find(t => t.slug === tagSlug);
        if (tag) {
          await supabase
            .from('knowledge_technique_tags')
            .upsert({
              technique_id: techniqueResult.id,
              tag_id: tag.id
            }, { onConflict: 'technique_id,tag_id' });
        }
      }

      console.log(`Inserted technique: ${technique.name}`);
    }

    // 4. Add some examples
    console.log('Adding examples...');
    const examplesTechnique = await supabase
      .from('knowledge_techniques')
      .select('id')
      .eq('slug', 'swot-analysis')
      .single();

    if (examplesTechnique.data) {
      const examples = [
        {
          technique_id: examplesTechnique.data.id,
          title: 'Tech Startup SWOT',
          description: 'A technology startup analyzing their position before seeking Series A funding',
          context: 'The startup had developed a mobile app with 50K users but was struggling with monetization',
          industry: 'Technology',
          company_size: 'Startup (10-50 employees)',
          outcome: 'Identified key revenue opportunities and secured $2M Series A funding',
          position: 1
        },
        {
          technique_id: examplesTechnique.data.id,
          title: 'Manufacturing Company Expansion',
          description: 'A mid-size manufacturer evaluating expansion into new markets',
          context: 'Company was considering expanding from domestic to international markets',
          industry: 'Manufacturing',
          company_size: 'Medium (100-500 employees)',
          outcome: 'Decided to focus on domestic market optimization first, increased efficiency by 25%',
          position: 2
        }
      ];

      for (const example of examples) {
        await supabase
          .from('knowledge_examples')
          .upsert(example, { onConflict: 'technique_id,position' });
      }
    }

    console.log('Test data population completed successfully!');
    return { success: true, message: 'Test data populated successfully' };

  } catch (error) {
    console.error('Error populating test data:', error);
    return { success: false, error };
  }
}