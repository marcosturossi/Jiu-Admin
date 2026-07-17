import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, saveAndWaitModalClose, createTestBelt, deleteTestBelt } from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E Requisito ${TS}`;
const UPDATED_DESC = `E2E Requisito Edit ${TS}`;

test.describe('Requisitos de Graduação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduation-requirements');
    await waitForTableReady(page);
  });

  test('lista requisitos de graduação', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de requisito de graduação', async ({ page }) => {
    const belt = await createTestBelt(page);

    // CREATE
    await page.goto('/system/graduation-requirements');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Requisito/i);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#description', TEST_DESC);
    await page.fill('#minimumClasses', '30');
    await saveAndWaitModalClose(page);
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
    page.once('dialog', d => d.accept());
    await updatedRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).not.toBeVisible();

    // CLEANUP
    await deleteTestBelt(page, belt.color);
  });
});
