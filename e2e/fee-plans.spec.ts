import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal } from './helpers';

const TS = Date.now();
const TEST_NAME = `Plano-E2E-${TS}`;
const UPDATED_NAME = `Plano-E2E-Edit-${TS}`;

test.describe('Planos de Mensalidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/fee-plans');
    await waitForTableReady(page);
  });

  test('lista planos de mensalidade', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de plano de mensalidade', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', TEST_NAME);
    await page.fill('#monthDuration', '12');
    await page.fill('#price', '150.00');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Search instead of assuming the new row lands on page 1 — the list is
    // shared across the whole suite and can span multiple pages.
    await page.fill('input[placeholder="Buscar plano"]', TEST_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_NAME)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#name', UPDATED_NAME);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar plano"]', UPDATED_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_NAME });
    page.once('dialog', d => d.accept());
    await updatedRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).not.toBeVisible();
  });
});
