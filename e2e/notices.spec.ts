import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E Aviso ${TS}`;
const UPDATED_DESC = `E2E Aviso Editado ${TS}`;

test.describe('Avisos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/notices');
    await waitForTableReady(page);
  });

  test('lista avisos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de aviso', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Aviso/i);
    await page.fill('#description', TEST_DESC);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#description', UPDATED_DESC);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_DESC });
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).not.toBeVisible();
  });
});
