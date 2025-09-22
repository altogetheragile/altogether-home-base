// This script documents the npm scripts that should be added to package.json
// Since we cannot modify package.json directly, these need to be added manually:

const scriptsToAdd = {
  "test:bdd": "cucumber-js",
  "test:bdd:dev": "cucumber-js --tags='not @skip' --parallel 1",
  "test:bdd:smoke": "cucumber-js --tags='@smoke'",
  "test:bdd:debug": "cucumber-js --tags='not @skip' --parallel 1 --world-parameters '{\"headless\": false, \"slowMo\": 500}'",
  "test:bdd:report": "cucumber-js --format html:cucumber-report.html",
  "test:bdd:ci": "cucumber-js --tags='not @skip' --parallel 2 --format pretty --format html:cucumber-report.html"
};

console.log('Add these scripts to your package.json:');
console.log(JSON.stringify(scriptsToAdd, null, 2));

module.exports = scriptsToAdd;