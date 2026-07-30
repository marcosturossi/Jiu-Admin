import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  createTestFeePlan,
  deleteTestStudent,
  deleteTestFeePlan,
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

  test('exige aluno, plano e data de início antes de criar', async ({ page }) => {
    await openCreateModal(page, /Novo Contrato/i);
    await page.getByRole('button', { name: /Criar Contrato/i }).click();

    await expect(page.locator('.invalid-feedback', { hasText: 'obrigatório' }).first()).toBeVisible();
    // Nothing submitted — modal must stay open since the form never became valid.
    await expect(page.locator('.modal.show').first()).toBeVisible();
  });

  test('lista todas as opções de status, alterna com sucesso e trata falhas de status/exclusão', async ({ page }) => {
    const student = await createTestStudent(page);
    const feePlan = await createTestFeePlan(page);

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

    // All 6 status options must be present in the edit dropdown.
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const statusSelect = page.locator('.modal.show select[formControlName="status"]');
    const values = await statusSelect.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(values.sort()).toEqual(['Active', 'Cancelled', 'Expired', 'Inactive', 'Suspended', 'Terminated'].sort());

    // Successful transition.
    await statusSelect.selectOption('Inactive');
    await page.getByRole('button', { name: /Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(row).toContainText('Inativo');

    // Failed transition — error toast, modal stays open, button re-enabled.
    await page.route('**/api/Contract**', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao atualizar status.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const statusSelect2 = page.locator('.modal.show select[formControlName="status"]');
    await statusSelect2.selectOption('Terminated');
    const updateButton = page.getByRole('button', { name: /Atualizar/i });
    await updateButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao atualizar status.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(updateButton).toBeEnabled();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.unroute('**/api/Contract**');

    // Failed cancellation (row delete button) — error toast, status unchanged.
    await page.route('**/api/Contract**', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao cancelar contrato.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao cancelar contrato.' })).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText('Inativo'); // unchanged — the mocked delete never took effect
    await page.unroute('**/api/Contract**');

    // NOTE: student/fee-plan intentionally not cleaned up — same FK constraint as the CRUD test above.
  });

  test('exibe erro quando falha ao criar contrato', async ({ page }) => {
    const student = await createTestStudent(page);
    const feePlan = await createTestFeePlan(page);

    await page.goto('/system/contracts');
    await waitForTableReady(page);

    await page.route('**/api/Contract**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar contrato.' }) });
      }
      return route.continue();
    });

    await openCreateModal(page, /Novo Contrato/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await selectFromSearchSelect(page, 'Plano de Pagamento', feePlan.name);
    await page.locator('input[type="date"]').fill('2030-01-01');
    const createButton = page.getByRole('button', { name: /Criar Contrato/i });
    await createButton.click();

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar contrato.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(createButton).toBeEnabled();
    await page.unroute('**/api/Contract**');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Creation failed, so no contract references these — safe to clean up.
    await deleteTestFeePlan(page, feePlan.name);
    await deleteTestStudent(page, student.firstName);
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Contract**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });
});
