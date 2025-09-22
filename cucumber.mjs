// cucumber.mjs
export default {
  default: {
    require: [
      'steps/**/*.ts',        // step definitions
      'support/**/*.ts'       // hooks, if you have them
    ],
    requireModule: ['tsx/esm'], // run TS directly in ESM mode
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
