import { test as base, type Page } from '@playwright/test';

export type { Page };
import MCR from 'monocart-coverage-reports';
import coverageOptions from './mcr.config';

/**
 * Auto-fixture: collects V8 JS + CSS coverage for every page opened during a
 * test (chromium only — the coverage API isn't supported by firefox/webkit)
 * and hands it off to monocart-coverage-reports. Raw coverage accumulates on
 * disk across all tests/workers; `global-teardown.ts` merges it into the
 * final report after the run.
 */
export const test = base.extend<{ autoCoverage: string }>({
  autoCoverage: [async ({ context }, use) => {
    const isChromium = test.info().project.name === 'chromium';

    const handlePageEvent = async (page: Page) => {
      await Promise.all([
        page.coverage.startJSCoverage({ resetOnNavigation: false }),
        page.coverage.startCSSCoverage({ resetOnNavigation: false }),
      ]);
    };

    if (isChromium) {
      context.on('page', handlePageEvent);
    }

    await use('autoCoverage');

    if (isChromium) {
      context.off('page', handlePageEvent);
      const coverageList = await Promise.all(context.pages().map(async (page) => {
        const jsCoverage = await page.coverage.stopJSCoverage();
        const cssCoverage = await page.coverage.stopCSSCoverage();
        return [...jsCoverage, ...cssCoverage];
      }));
      const mcr = MCR(coverageOptions);
      await mcr.add(coverageList.flat());
    }
  }, { scope: 'test', auto: true }],
});

export const expect = test.expect;
