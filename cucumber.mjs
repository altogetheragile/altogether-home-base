// cucumber.mjs
export default {
  default: {
    // Load step definitions (recursive glob)
    require: [
      'steps/**/*.ts',        // your step defs
      'support/**/*.ts'       // hooks like Before/After
    ],

    // Use tsx in ESM mode to run TS directly
    requireModule: ['tsx/esm'],

    // Formatters: progress (short), summary, and HTML report
    format: [
      'progress',
      'summary',
      'html:reports/cucumber-report.html'
    ],

    // Fail fast on first error (optional)
    failFast: false,

    // Don't spam the publish banner
    publishQuiet: true,

    // Retry flaky steps (optional, Playwright-friendly)
    retry: 0,

    // Timeouts (adjust as needed)
    worldParameters: {
      defaultTimeout: 60 * 1000
    }
  }
};