import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_NAME = `E2E-Cat-${TS}`;
const UPDATED_NAME = `E2E-Cat-Edit-${TS}`;

test.describe('Categorias de Transação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/transaction-categories');
    await waitForTableReady(page);
  });

  test('lista categorias de transação', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de categoria de transação', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Categoria/i);
    await page.fill('#name', TEST_NAME);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
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
    await expect(page.locator('table').getByText(UPDATED_NAME)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_NAME });
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).not.toBeVisible();
  });
});
