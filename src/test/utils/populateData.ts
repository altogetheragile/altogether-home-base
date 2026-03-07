// Utility to run the test data population
import { populateTestData } from '@/scripts/populateTestData';

async function runPopulation() {
  await populateTestData();
}

// Run if this file is executed directly
if (import.meta.env.DEV) {
  runPopulation();
}

export { runPopulation };