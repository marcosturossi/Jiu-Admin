import { test, expect, type Page } from './coverage-fixture';

const JOB_KEYS = [
  'lesson-schedule-generation',
  'monthly-fee-generation',
  'payment-charge-generation',
  'birthday-greetings',
  'contract-renewal-warnings',
  'weekly-frequency-report',
] as const;

async function waitForTableReady(page: Page): Promise<void> {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('table')).toBeVisible();
}

function switchFor(page: Page, jobKey: string) {
  return page.locator(`#job-switch-${jobKey}`);
}

// Job enabled/disabled state is per-tenant config shared by the whole tenant (same
// singleton-resource shape as payment-settings.spec.ts), so this suite snapshots
// whatever was already configured and restores it afterAll — no test may leave a
// job's enabled state mutated once the file finishes.
test.describe('Jobs Agendados', () => {
  let original: Record<string, boolean>;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/scheduled-jobs');
    await waitForTableReady(page);

    original = {};
    for (const jobKey of JOB_KEYS) {
      original[jobKey] = await switchFor(page, jobKey).isChecked();
    }
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/scheduled-jobs');
    await waitForTableReady(page);

    for (const jobKey of JOB_KEYS) {
      const toggle = switchFor(page, jobKey);
      if ((await toggle.isChecked()) !== original[jobKey]) {
        await toggle.click();
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
      }
    }
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/scheduled-jobs');
    await waitForTableReady(page);
  });

  test('carrega a página com os 6 jobs cadastrados', async ({ page }) => {
    await expect(page.locator('app-subnav')).toBeVisible();
    for (const jobKey of JOB_KEYS) {
      await expect(switchFor(page, jobKey)).toBeVisible();
    }
  });

  test('desabilita um job e persiste após recarregar a página', async ({ page }) => {
    const jobKey = 'lesson-schedule-generation';
    const toggle = switchFor(page, jobKey);
    const wasChecked = await toggle.isChecked();
    if (!wasChecked) await toggle.click(); // ensure a known starting state (enabled)
    await expect(toggle).toBeChecked();

    await toggle.click();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    await expect(toggle).not.toBeChecked();

    await page.reload();
    await waitForTableReady(page);
    await expect(switchFor(page, jobKey)).not.toBeChecked();

    // restore
    await switchFor(page, jobKey).click();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
  });

  test('reabilita um job desabilitado e persiste após recarregar a página', async ({ page }) => {
    const jobKey = 'birthday-greetings';
    const toggle = switchFor(page, jobKey);
    if (await toggle.isChecked()) {
      await toggle.click(); // ensure a known starting state (disabled)
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    }
    await expect(toggle).not.toBeChecked();

    await toggle.click();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    await expect(toggle).toBeChecked();

    await page.reload();
    await waitForTableReady(page);
    await expect(switchFor(page, jobKey)).toBeChecked();
  });

  test('altera o horário (UTC) de um job diário e persiste após recarregar', async ({ page }) => {
    const jobKey = 'birthday-greetings'; // Daily cadence — hour-only, no day selects
    const row = page.locator('tr', { has: switchFor(page, jobKey) });
    const hourSelect = row.locator('select[title="Hora (UTC)"]');
    await expect(hourSelect).toBeVisible();
    // A Daily job must never show the weekly/monthly day pickers.
    await expect(row.locator('select[title="Dia do mês"]')).toHaveCount(0);

    const original = await hourSelect.inputValue();
    const target = original === '5' ? '6' : '5';
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/api/scheduled-jobs/${jobKey}`) && r.request().method() === 'PATCH'),
      hourSelect.selectOption(target),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForTableReady(page);
    await expect(row.locator('select[title="Hora (UTC)"]')).toHaveValue(target);

    // restore
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/api/scheduled-jobs/${jobKey}`) && r.request().method() === 'PATCH'),
      row.locator('select[title="Hora (UTC)"]').selectOption(original),
    ]);
  });

  test('altera o dia da semana de um job semanal sem afetar a hora configurada', async ({ page }) => {
    const jobKey = 'contract-renewal-warnings'; // Weekly cadence
    const row = page.locator('tr', { has: switchFor(page, jobKey) });
    const daySelect = row.locator('select[title="Dia da semana"]');
    const hourSelect = row.locator('select[title="Hora (UTC)"]');
    await expect(daySelect).toBeVisible();

    const originalDay = await daySelect.inputValue();
    const originalHour = await hourSelect.inputValue();
    const targetDay = originalDay === '2' ? '3' : '2';
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/api/scheduled-jobs/${jobKey}`) && r.request().method() === 'PATCH'),
      daySelect.selectOption(targetDay),
    ]);
    expect(response.ok()).toBeTruthy();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await expect(hourSelect).toHaveValue(originalHour);

    await page.reload();
    await waitForTableReady(page);
    const reloadedRow = page.locator('tr', { has: switchFor(page, jobKey) });
    await expect(reloadedRow.locator('select[title="Dia da semana"]')).toHaveValue(targetDay);
    await expect(reloadedRow.locator('select[title="Hora (UTC)"]')).toHaveValue(originalHour);

    // restore
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/api/scheduled-jobs/${jobKey}`) && r.request().method() === 'PATCH'),
      reloadedRow.locator('select[title="Dia da semana"]').selectOption(originalDay),
    ]);
  });

  test('exibe erro e mantém o estado anterior quando a atualização falha', async ({ page }) => {
    await page.route('**/api/scheduled-jobs/**', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao atualizar o job.' }),
        });
      }
      return route.continue();
    });

    const jobKey = 'contract-renewal-warnings';
    const toggle = switchFor(page, jobKey);
    const wasChecked = await toggle.isChecked();

    await toggle.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao atualizar o job.' })).toBeVisible({ timeout: 10_000 });
    // Switch reflects the DOM checkbox's own click, but the underlying signal never
    // updated on failure — reloading (bypassing the failed route) must show the old value.
    await page.unroute('**/api/scheduled-jobs/**');
    await page.reload();
    await waitForTableReady(page);
    if (wasChecked) {
      await expect(switchFor(page, jobKey)).toBeChecked();
    } else {
      await expect(switchFor(page, jobKey)).not.toBeChecked();
    }
  });
});
