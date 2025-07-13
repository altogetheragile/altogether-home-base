// Simple Node.js script to populate test data
// Run with: node scripts/populate-test-data.js

import { createClient } from '@supabase/supabase-js';

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

    console.log('🎉 Test data population completed!');
    console.log('💡 Now you can manually add techniques through the admin interface or use the app to test existing functionality');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

populateData();