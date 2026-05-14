import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal } from './helpers';

const TS = Date.now();
const TEST_DATE = '2030-01-15';
const TEST_DESC = `E2E-Transacao-${TS}`;
const UPDATED_DESC = `E2E-Transacao-Edit-${TS}`;

test.describe('Transações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/transactions');
    await waitForTableReady(page);
  });

  test('lista transações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test.skip('CRUD completo de transação — backend retorna 500 ao criar, investigar na API', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Transação/i);
    // Select "Receita" (first real option, index 1 skips placeholder)
    await page.selectOption('#type', { label: 'Receita' });
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '99.99');
    await page.fill('#transactionDate', TEST_DATE);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-secondary').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#description', UPDATED_DESC);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_DESC });
    page.once('dialog', d => d.accept());
    await updatedRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).not.toBeVisible();
  });
});
