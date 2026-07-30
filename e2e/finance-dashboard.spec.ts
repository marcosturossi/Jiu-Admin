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

  test('mantém os indicadores em zero, sem travar, quando a API de saldo falha', async ({ page }) => {
    await page.route('**/api/FinancialOverview/balance', (route) => route.fulfill({
      status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }),
    }));
    await page.reload();
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards.first()).toBeVisible();
    await expect(kpiCards).toHaveCount(4);
  });

  test('exibe alerta de erro na seção de vencidas quando a API falha', async ({ page }) => {
    await page.route('**/api/AccountsReceivable/overdue**', (route) => route.fulfill({
      status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }),
    }));
    await page.reload();
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    const overdueSection = page.locator('.dashboard-card', { hasText: /vencid/i });
    await expect(overdueSection.locator('.alert-danger')).toBeVisible({ timeout: 10_000 });
  });

  test('não trava a página quando a API do gráfico de fluxo de caixa falha', async ({ page }) => {
    // The cashflow chart is the only caller that passes OrderByDescending=true
    // to this shared list endpoint — distinguishes it from the plain list load.
    await page.route('**/api/AccountsReceivable**', (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && url.searchParams.get('OrderByDescending') === 'true') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    // Page must remain usable — the other two dashboard cards still render.
    await expect(page.locator('.kpi-card').first()).toBeVisible();
  });
});
