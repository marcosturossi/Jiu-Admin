import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  deleteTestStudent,
  createTestBelt,
  deleteTestBelt,
  acceptConfirmDialog,
  type TestStudent,
  type TestBelt,
} from './helpers';

test.describe('Graduações', () => {
  // Shared across the error-path/validation tests below, which just need
  // *some* real student+belt to pick from — not something each test owns.
  let sharedStudent: TestStudent;
  let sharedBelt: TestBelt;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    sharedStudent = await createTestStudent(page);
    sharedBelt = await createTestBelt(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await deleteTestBelt(page, sharedBelt.color);
    await deleteTestStudent(page, sharedStudent.firstName);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduations');
    await waitForTableReady(page);
  });

  test('lista graduações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria, edita e exclui graduação', async ({ page }) => {
    const student = await createTestStudent(page);
    const belt = await createTestBelt(page);

    // CREATE
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#graduationDate', '2029-06-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    // The list isn't sorted newest-first and has no working free-text search
    // (the backend's Graduation endpoint has no name filter param at all —
    // FilterComponent's text box is wired to onFilterChange but silently
    // discarded), so with enough accumulated rows the new one can land off
    // page 1. Bump the page size to the max instead of assuming page 1.
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();
    await expect(row).toContainText(belt.color);

    // EDIT — change the graduation date
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#graduationDate', '2029-07-15');
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(row).toContainText('15/07/2029');

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestBelt(page, belt.color);
    await deleteTestStudent(page, student.firstName);
  });

  test('exige aluno, faixa e data antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Nova Graduação/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    // graduationDate defaults to today, so aluno + faixa are the missing pieces initially.
    await expect(saveButton).toBeDisabled();
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await expect(saveButton).toBeDisabled(); // still missing faixa
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Graduation**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro e permite tentar novamente quando falha ao criar', async ({ page }) => {
    await page.route('**/api/Graduation', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar graduação.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar graduação.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await page.fill('#graduationDate', '2029-06-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: sharedStudent.lastName });
    await expect(row).toBeVisible();

    await page.route('**/api/Graduation/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar graduação.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#graduationDate', '2029-07-15');
    const saveButton = page.getByRole('button', { name: /Salvar|Atualizar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar graduação.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.unroute('**/api/Graduation/*');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await page.fill('#graduationDate', '2029-06-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: sharedStudent.lastName });
    await page.route('**/api/Graduation/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir graduação.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir graduação.' })).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();

    await page.unroute('**/api/Graduation/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
