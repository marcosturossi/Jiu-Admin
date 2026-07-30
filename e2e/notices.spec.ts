import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E Aviso ${TS}`;
const UPDATED_DESC = `E2E Aviso Editado ${TS}`;

test.describe('Avisos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/notices');
    await waitForTableReady(page);
  });

  test('lista avisos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de aviso', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Aviso/i);
    await page.fill('#description', TEST_DESC);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
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
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_DESC)).not.toBeVisible();
  });

  test('exige descrição antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Novo Aviso/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();
    await page.fill('#description', 'Aviso Temp');
    await expect(saveButton).toBeEnabled();
    await page.fill('#description', '');
    await expect(saveButton).toBeDisabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Notices**', (route) => {
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
    await page.route('**/api/Notices', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar aviso.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Aviso/i);
    await page.fill('#description', TEST_DESC);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar aviso.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateModal(page, /Novo Aviso/i);
    await page.fill('#description', TEST_DESC);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.route('**/api/Notices/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar aviso.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#description', UPDATED_DESC);
    const saveButton = page.getByRole('button', { name: /Salvar|Atualizar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar aviso.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.unroute('**/api/Notices/*');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    const cleanupRow = page.locator('tr', { hasText: TEST_DESC });
    await cleanupRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Aviso/i);
    await page.fill('#description', TEST_DESC);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.route('**/api/Notices/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir aviso.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir aviso.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.unroute('**/api/Notices/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
