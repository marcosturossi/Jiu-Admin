import { test, expect } from '@playwright/test';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  createTestFeePlan,
  acceptConfirmDialog,
} from './helpers';

test.describe('Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/contracts');
    await waitForTableReady(page);
  });

  test('lista contratos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria, edita status e cancela contrato', async ({ page }) => {
    const student = await createTestStudent(page);
    const feePlan = await createTestFeePlan(page);

    // CREATE
    await page.goto('/system/contracts');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Contrato/i);

    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await selectFromSearchSelect(page, 'Plano de Pagamento', feePlan.name);
    await page.locator('input[type="date"]').fill('2030-01-01');

    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Ativo');

    // EDIT STATUS
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const statusSelect = page.locator('.modal.show select[formControlName="status"]');
    await statusSelect.selectOption('Suspended');
    await page.getByRole('button', { name: /Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(row).toContainText('Suspenso');

    // "DELETE" — the backend implements this as a status change to Cancelled, not a
    // real removal (confirmed via network inspection: DELETE returns 204 but the
    // contract keeps appearing in the list, now Cancelled — even a second delete
    // attempt on an already-cancelled contract doesn't remove it). Assert the real
    // behavior instead of a row disappearing.
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).toContainText('Cancelado');

    // NOTE: the fee-plan and student created above intentionally aren't cleaned up
    // here — since the contract is never actually removed, both remain referenced
    // by it and the backend rejects deleting them (FK constraint on the contract).
  });
});
