import type { CoverageReportOptions } from 'monocart-coverage-reports';

// https://github.com/cenfun/monocart-coverage-reports
const coverageOptions: CoverageReportOptions = {
  name: 'Jiu-Admin E2E Coverage',

  reports: ['v8', 'console-details', 'lcovonly'],

  entryFilter: {
    '**/node_modules/**': false,
    '**/**': true,
  },

  sourceFilter: {
    '**/node_modules/**': false,
    'src/**': true,
  },

  outputDir: './coverage/e2e',
};

export default coverageOptions;
