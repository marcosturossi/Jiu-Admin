import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, selectFromSearchSelect, createTestStudent, deleteTestStudent, acceptConfirmDialog } from './helpers';
import path from 'path';

const FIXTURE_IMAGE = path.join(__dirname, 'fixtures', 'test-image.jpeg');

test.describe('Reconhecimento Facial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
  });

  test('lista pessoas cadastradas', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui pessoa no reconhecimento facial', async ({ page }) => {
    const student = await createTestStudent(page);

    // CREATE
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Pessoa/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.locator('#imagesInput').setInputFiles(FIXTURE_IMAGE);
    await page.getByRole('button', { name: /Criar Pessoa/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestStudent(page, student.firstName);
  });

  test('exige aluno e ao menos uma foto antes de habilitar criar', async ({ page }) => {
    const student = await createTestStudent(page);
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Pessoa/i);
    const createButton = page.getByRole('button', { name: /Criar Pessoa/i });
    await expect(createButton).toBeDisabled();

    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await expect(createButton).toBeDisabled(); // still missing photo

    await page.locator('#imagesInput').setInputFiles(FIXTURE_IMAGE);
    await expect(createButton).toBeEnabled();

    await deleteTestStudent(page, student.firstName);
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/v1/persons**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro e permite tentar novamente quando falha ao criar', async ({ page }) => {
    const student = await createTestStudent(page);

    await page.route('**/api/v1/register-multiple', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Falha simulada ao registrar pessoa.' }) });
      }
      return route.continue();
    });

    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Pessoa/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.locator('#imagesInput').setInputFiles(FIXTURE_IMAGE);
    const createButton = page.getByRole('button', { name: /Criar Pessoa/i });
    await createButton.click();
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(createButton).toBeEnabled();

    await page.unroute('**/api/v1/register-multiple');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await deleteTestStudent(page, student.firstName);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    const student = await createTestStudent(page);
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Pessoa/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.locator('#imagesInput').setInputFiles(FIXTURE_IMAGE);
    await page.getByRole('button', { name: /Criar Pessoa/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();

    await page.route('**/api/v1/persons/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Falha simulada ao excluir pessoa.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();

    await page.unroute('**/api/v1/persons/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    await deleteTestStudent(page, student.firstName);
  });
});
