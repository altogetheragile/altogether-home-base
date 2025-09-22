// cucumber.mjs
export default {
  default: {
    import: [
      'steps/**/*.ts',        // step definitions
      'support/**/*.ts'       // hooks, if you have them
    ],
    paths: ['features/**/*.feature'], // feature files
    format: [
      'progress',
      'summary',
      'html:cucumber-reports/cucumber-report.html'
    ],
    publishQuiet: true,
    failFast: false,
    retry: 0,
    worldParameters: {
      defaultTimeout: 60 * 1000
    }
  }
}
