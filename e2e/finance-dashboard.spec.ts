import { test, expect } from './coverage-fixture';

test.describe('Dashboard Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/finance-dashboard');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.spinner-border')).toHaveCount(0, { timeout: 10_000 });
  });

  test('exibe os indicadores financeiros', async ({ page }) => {
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards.first()).toBeVisible();
    await expect(kpiCards).toHaveCount(4);

    for (const card of await kpiCards.all()) {
      await expect(card.locator('.kpi-value')).not.toBeEmpty();
    }
  });

  test('exibe mensalidades vencidas ou estado vazio', async ({ page }) => {
    const overdueSection = page.locator('.dashboard-card', { hasText: /vencid/i });
    await expect(overdueSection).toBeVisible();
    await expect(overdueSection.locator('table, .empty-state')).toBeVisible();
  });
});
