import { test, expect } from './coverage-fixture';
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

  test('gera título automaticamente a partir da data, ou exige título manual quando desativado', async ({ page }) => {
    await openCreateModal(page, /Nova Aula/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(page.locator('#title')).toBeDisabled(); // auto-title starts checked

    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await expect(page.locator('#title')).toHaveValue(/2030/);
    await expect(saveButton).toBeEnabled(); // duration already defaults to 01:00

    await page.locator('#generate-title').uncheck();
    await expect(page.locator('#title')).toBeEnabled();
    await expect(page.locator('#title')).toHaveValue(''); // cleared when switching to manual
    await expect(saveButton).toBeDisabled();
    await page.fill('#title', 'Título Manual');
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Lesson**', (route) => {
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
    await page.route('**/api/Lesson', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar aula.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', TEST_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar aula.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', TEST_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    await page.route('**/api/Lesson/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar aula.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#title', UPDATED_TITLE);
    const saveButton = page.getByRole('button', { name: /Salvar|Atualizar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar aula.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.unroute('**/api/Lesson/*');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    const cleanupRow = page.locator('tr', { hasText: TEST_TITLE });
    await cleanupRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', TEST_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    await page.route('**/api/Lesson/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir aula.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir aula.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    await page.unroute('**/api/Lesson/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
