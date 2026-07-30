import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_NAME = `Plano-E2E-${TS}`;
const UPDATED_NAME = `Plano-E2E-Edit-${TS}`;

test.describe('Planos de Mensalidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/fee-plans');
    await waitForTableReady(page);
  });

  test('lista planos de mensalidade', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de plano de mensalidade', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', TEST_NAME);
    await page.fill('#monthDuration', '12');
    await page.fill('#price', '150.00');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Search instead of assuming the new row lands on page 1 — the list is
    // shared across the whole suite and can span multiple pages.
    await page.fill('input[placeholder="Buscar plano"]', TEST_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_NAME)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#name', UPDATED_NAME);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar plano"]', UPDATED_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_NAME });
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).not.toBeVisible();
  });

  test('exige nome, duração e preço antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Novo Plano/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.fill('#name', 'Plano Temporário');
    await expect(saveButton).toBeDisabled();

    await page.fill('#price', '100');
    await expect(saveButton).toBeEnabled(); // monthDuration already defaults to 1

    await page.fill('#name', '');
    await expect(saveButton).toBeDisabled();
  });

  test('exige duração mínima de 1 mês', async ({ page }) => {
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', 'Plano Temporário');
    await page.fill('#price', '100');
    await page.fill('#monthDuration', '0');
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeDisabled();

    await page.fill('#monthDuration', '1');
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/FeePlan**', (route) => {
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
    await page.route('**/api/FeePlan', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar plano.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', 'Plano Falho');
    await page.fill('#monthDuration', '12');
    await page.fill('#price', '150.00');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar plano.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible(); // modal stays open for retry
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', TEST_NAME);
    await page.fill('#monthDuration', '12');
    await page.fill('#price', '150.00');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar plano"]', TEST_NAME);
    await page.waitForTimeout(500);
    await waitForTableReady(page);

    await page.route('**/api/FeePlan/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar plano.' }) });
      }
      return route.continue();
    });

    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#name', UPDATED_NAME);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar plano.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // cleanup: close modal and delete the leftover plan directly
    await page.unroute('**/api/FeePlan/*');
    await page.getByRole('button', { name: 'Fechar' }).click();
    await waitForTableReady(page);
    const cleanupRow = page.locator('tr', { hasText: TEST_NAME });
    await cleanupRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Plano/i);
    await page.fill('#name', TEST_NAME);
    await page.fill('#monthDuration', '12');
    await page.fill('#price', '150.00');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar plano"]', TEST_NAME);
    await page.waitForTimeout(500);
    await waitForTableReady(page);

    await page.route('**/api/FeePlan/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir plano.' }) });
      }
      return route.continue();
    });

    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir plano.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table').getByText(TEST_NAME)).toBeVisible(); // row must remain since delete failed

    // cleanup: unroute and actually delete it
    await page.unroute('**/api/FeePlan/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
