const { setDefaultTimeout } = require('@cucumber/cucumber');

// Set default timeout for all steps
setDefaultTimeout(30 * 1000);

module.exports = {
  default: {
    require: [
      'steps/**/*.ts',
      'support/**/*.ts'
    ],
    requireModule: ['tsx/cjs'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    parallel: 2,
    retry: 1
  }
};