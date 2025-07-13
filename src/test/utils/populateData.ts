// Utility to run the test data population
import { populateTestData } from '@/scripts/populateTestData';

async function runPopulation() {
  console.log('🚀 Starting test data population...');
  
  const result = await populateTestData();
  
  if (result.success) {
    console.log('✅ Test data populated successfully!');
    console.log('📊 You can now test the knowledge base with realistic data');
    console.log('🔗 Navigate to /knowledge to see the populated techniques');
  } else {
    console.error('❌ Failed to populate test data:', result.error);
  }
}

// Run if this file is executed directly
if (import.meta.env.DEV) {
  runPopulation();
}

export { runPopulation };