import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

test.describe('Graduações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduations');
    await waitForTableReady(page);
  });

  test('lista graduações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui graduação', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Graduação/i);

    // Select a student via search-select (search empty to load first page of students)
    await selectFromSearchSelect(page, 'Aluno', '');

    // Select the first available belt
    await page.selectOption('#beltId', { index: 1 });

    // Set graduation date
    await page.fill('#graduationDate', '2030-01-01');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify a row appeared (graduation date visible)
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // DELETE the first row created
    const firstRow = page.locator('table tbody tr').first();
    page.once('dialog', d => d.accept());
    await firstRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });
});
