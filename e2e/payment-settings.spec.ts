import { test, expect, type Page } from './coverage-fixture';

async function waitForFormReady(page: Page): Promise<void> {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#defaultBillingType')).toBeVisible();
}

async function save(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Salvar/i }).click();
}

// TenantSettings.DefaultBillingType is a singleton resource shared by the whole tenant — every
// test here operates on a captured snapshot of whatever was already configured and afterAll
// restores it, same pattern as the other singleton-settings specs in this suite.
test.describe('Configurações de Cobrança', () => {
  let original: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
    original = await page.locator('#defaultBillingType').inputValue();
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
    await page.locator('#defaultBillingType').selectOption(original);
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
  });

  test('carrega a página com a forma de pagamento padrão atual selecionada', async ({ page }) => {
    await expect(page.locator('app-subnav')).toBeVisible();
    await expect(page.locator('#defaultBillingType')).toHaveValue(original);
  });

  test('lista todas as opções de forma de pagamento padrão', async ({ page }) => {
    const values = await page.locator('#defaultBillingType option').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values).toEqual(['', 'PIX', 'BOLETO', 'CREDIT_CARD', 'MONEY']);
  });

  test('salva uma nova forma de pagamento padrão e persiste após recarregar', async ({ page }) => {
    await page.locator('#defaultBillingType').selectOption('PIX');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForFormReady(page);
    await expect(page.locator('#defaultBillingType')).toHaveValue('PIX');
  });

  test('salva "sem padrão" (usa PIX) e persiste após recarregar', async ({ page }) => {
    await page.locator('#defaultBillingType').selectOption('BOLETO');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.locator('#defaultBillingType').selectOption('');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForFormReady(page);
    await expect(page.locator('#defaultBillingType')).toHaveValue('');
  });

  test('exibe erro e não trava a página quando o carregamento das configurações falha', async ({ page }) => {
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao carregar configurações.' }),
        });
      }
      return route.continue();
    });

    await page.reload();
    await waitForFormReady(page);

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao carregar configurações.' })).toBeVisible({ timeout: 10_000 });
    // Page must remain usable (not stuck on the loading spinner) after a failed GET.
    await expect(page.locator('#defaultBillingType')).toBeVisible();
  });

  test('exibe erro e reabilita o botão quando salvar falha', async ({ page }) => {
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao salvar configurações.' }),
        });
      }
      return route.continue();
    });

    await save(page);

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao salvar configurações.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-success')).not.toBeVisible();
    // isSaving must reset to false on failure so the user can retry.
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });

  test('exibe o histórico de alterações após salvar', async ({ page }) => {
    await page.locator('#defaultBillingType').selectOption('CREDIT_CARD');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('table', { hasText: 'Ação' })).toBeVisible({ timeout: 10_000 });
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
  });

  test('expande e recolhe uma linha do histórico', async ({ page }) => {
    await page.locator('#defaultBillingType').selectOption('MONEY');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    const expandButton = page.locator('table tbody tr').first().locator('button');
    await expandButton.click();
    await expect(page.locator('.audit-json').first()).toBeVisible();
    await expandButton.click();
    await expect(page.locator('.audit-json').first()).not.toBeVisible();
  });
});
