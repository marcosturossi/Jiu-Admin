import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

test.describe('Atestados Médicos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/medical-clearances');
    await waitForTableReady(page);
  });

  test('lista atestados médicos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui atestado médico', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Atestado/i);

    // Select a student
    await selectFromSearchSelect(page, 'Aluno', '');

    // Set expiry date
    await page.fill('#expiresAt', '2030-12-31');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify at least one row appeared
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // DELETE
    page.once('dialog', d => d.accept());
    await firstRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });
});
