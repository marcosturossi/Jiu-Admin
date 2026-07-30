import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  deleteTestStudent,
  acceptConfirmDialog,
  type TestStudent,
} from './helpers';

test.describe('Atestados Médicos', () => {
  let sharedStudent: TestStudent;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    sharedStudent = await createTestStudent(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await deleteTestStudent(page, sharedStudent.firstName);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/medical-clearances');
    await waitForTableReady(page);
  });

  test('lista atestados médicos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui atestado médico', async ({ page }) => {
    const student = await createTestStudent(page);

    // CREATE
    await page.goto('/system/medical-clearances');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Atestado/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#expiresAt', '2030-12-31');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();

    // NOTE: no search test here — the "Buscar por aluno" box only emits free
    // text, but apiMedicalClearanceGet only accepts filtering by studentId
    // (confirmed via the generated client), so the search box can't actually
    // filter this list. Not an e2e flakiness issue; the feature isn't wired
    // to the backend at all.

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestStudent(page, student.firstName);
  });

  test('exige aluno e data de expiração antes de habilitar salvar; aceita marcar "aprovado"', async ({ page }) => {
    await openCreateModal(page, /Novo Atestado/i);
    const saveButton = page.getByRole('button', { name: /Salvar|Criar/i });
    await expect(saveButton).toBeDisabled();

    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await expect(saveButton).toBeDisabled(); // still missing expiresAt
    await page.fill('#expiresAt', '2030-12-31');
    await expect(saveButton).toBeEnabled();

    await page.locator('#isApprovedCheck').check();
    await expect(page.locator('#isApprovedCheck')).toBeChecked();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/MedicalClearance**', (route) => {
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
    await page.route('**/api/MedicalClearance', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar atestado.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Atestado/i);
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await page.fill('#expiresAt', '2030-12-31');
    const saveButton = page.getByRole('button', { name: /Salvar|Criar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar atestado.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Atestado/i);
    await selectFromSearchSelect(page, 'Aluno', sharedStudent.lastName);
    await page.fill('#expiresAt', '2030-12-31');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: sharedStudent.lastName });
    await expect(row).toBeVisible();

    await page.route('**/api/MedicalClearance/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir atestado.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir atestado.' })).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();

    await page.unroute('**/api/MedicalClearance/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
