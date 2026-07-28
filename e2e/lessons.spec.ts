import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_TITLE = `Aula-E2E-${TS}`;
const UPDATED_TITLE = `Aula-E2E-Edit-${TS}`;

test.describe('Aulas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/lessons');
    await waitForTableReady(page);
  });

  test('lista aulas', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de aula', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Aula/i);
    // Uncheck auto-title so we can set a custom title for later assertions
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', TEST_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#title', UPDATED_TITLE);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_TITLE });
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).not.toBeVisible();
  });
});
