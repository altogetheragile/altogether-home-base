// This script documents the npm scripts that should be added to package.json
// Since we cannot modify package.json directly, these need to be added manually:

const scriptsToAdd = {
  "test:bdd": "npx cucumber-js",
  "test:bdd:dev": "npx cucumber-js --tags \"not @skip\" --parallel 1",
  "test:bdd:smoke": "npx cucumber-js --tags \"@smoke\"",
  "test:bdd:debug": "npx cucumber-js --tags \"not @skip\" --parallel 1 --world-parameters '{\"headless\": false, \"slowMo\": 500}'",
  "test:bdd:report": "npx cucumber-js --format html:cucumber-report.html",
  "test:bdd:ci": "npx cucumber-js --tags \"not @skip\" --parallel 2 --format pretty --format html:cucumber-report.html"
};

console.log('Add these scripts to your package.json:');
console.log(JSON.stringify(scriptsToAdd, null, 2));

module.exports = scriptsToAdd;