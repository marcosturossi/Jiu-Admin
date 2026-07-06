import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

test.describe('Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/contracts');
    await waitForTableReady(page);
  });

  test('lista contratos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria, edita status e exclui contrato', async ({ page }) => {
    // CREATE — requires an existing student and fee-plan in the DB
    await openCreateModal(page, /Novo Contrato/i);

    // Select a student — skip if no students exist in the database
    const field = page.locator('.mb-3', { hasText: 'Aluno' });
    await field.locator('.search-select-trigger').click();
    const searchModal = page.locator('.modal.show').last();
    await expect(searchModal).toBeVisible({ timeout: 5_000 });
    await searchModal.locator('input[placeholder="Buscar..."]').fill('');
    const firstResult = searchModal.locator('li.list-group-item-action:not(.search-select-clear)').first();
    const hasStudents = await firstResult.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStudents) {
      await page.keyboard.press('Escape');
      test.skip(true, 'Sem alunos cadastrados para criar contrato');
      return;
    }
    await firstResult.click();

    // Select a fee-plan
    await selectFromSearchSelect(page, 'Plano de Pagamento', '');

    // Set start date
    await page.locator('input[type="date"]').fill('2030-01-01');

    await page.getByRole('button', { name: /Criar Contrato|Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify at least one row is visible
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // EDIT STATUS — open update modal and change status
    await firstRow.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    // Select the second option in the status select (first is the current status)
    const statusSelect = page.locator('select[formControlName="status"], .modal.show select').first();
    await statusSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: /Atualizar|Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // DELETE
    const row = page.locator('table tbody tr').first();
    page.once('dialog', d => d.accept());
    await row.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });
});
