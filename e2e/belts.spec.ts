import type { Page } from '@playwright/test';
import { test, expect } from './coverage-fixture';
import { acceptConfirmDialog } from './helpers';

const timestamp = Date.now();
const TEST_COLOR = `E2E-Cor-${timestamp}`;
const UPDATED_COLOR = `E2E-Editada-${timestamp}`;
const TEST_ORDER = 99;

async function openCreateDialog(page: Page) {
  await page.getByRole('button', { name: /Nova Faixa/i }).click();
  await expect(page.locator('.modal.show')).toBeVisible();
}

test.describe('Faixas — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/belts');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  });

  test('exibe a lista de faixas', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Faixa/i })).toBeVisible();
  });

  test('cria, edita e exclui uma faixa', async ({ page }) => {
    // ── CREATE ────────────────────────────────────────────────────────
    await openCreateDialog(page);

    await page.getByLabel('Cor da Faixa *').fill(TEST_COLOR);
    await page.getByLabel('Ordem *').fill(String(TEST_ORDER));

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });

    // ── VERIFY IN LIST ────────────────────────────────────────────────
    // The list isn't sorted newest-first, so with enough accumulated rows the
    // new one can land off page 1. Bump the page size instead of assuming it.
    await page.selectOption('select', '100').catch(() => {});
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_COLOR)).toBeVisible();

    // ── EDIT ─────────────────────────────────────────────────────────
    const row = page.locator('tr', { hasText: TEST_COLOR });
    await row.locator('.btn-outline-info').click();
    await expect(page.locator('.modal.show')).toBeVisible();

    const colorInput = page.getByLabel('Cor da Faixa *');
    await colorInput.clear();
    await colorInput.fill(UPDATED_COLOR);

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });

    // Updated color should now appear
    await expect(page.getByText(UPDATED_COLOR)).toBeVisible({ timeout: 10_000 });

    // ── DELETE ────────────────────────────────────────────────────────
    const updatedRow = page.locator('tr', { hasText: UPDATED_COLOR });
    await updatedRow.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);

    await expect(page.getByText(UPDATED_COLOR)).not.toBeVisible({ timeout: 10_000 });
  });

  test('exige cor e ordem antes de habilitar salvar, aceita marcar "para crianças"', async ({ page }) => {
    await openCreateDialog(page);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled(); // color starts empty (required); orderIndex defaults to 0, already valid

    await page.getByLabel('Cor da Faixa *').fill('Cor Temp');
    await expect(saveButton).toBeEnabled();

    await page.getByLabel('Ordem *').fill('-1');
    await expect(saveButton).toBeDisabled();
    await page.getByLabel('Ordem *').fill('5');
    await expect(saveButton).toBeEnabled();

    await page.locator('#isForKids').check();
    await expect(page.locator('#isForKids')).toBeChecked();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Belt**', (route) => {
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
    await page.route('**/api/Belt', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar faixa.' }) });
      }
      return route.continue();
    });
    await openCreateDialog(page);
    await page.getByLabel('Cor da Faixa *').fill(TEST_COLOR);
    await page.getByLabel('Ordem *').fill(String(TEST_ORDER));
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar faixa.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show')).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateDialog(page);
    await page.getByLabel('Cor da Faixa *').fill(TEST_COLOR);
    await page.getByLabel('Ordem *').fill(String(TEST_ORDER));
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await page.selectOption('select', '100').catch(() => {});
    await expect(page.getByText(TEST_COLOR)).toBeVisible({ timeout: 10_000 });

    await page.route('**/api/Belt/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar faixa.' }) });
      }
      return route.continue();
    });

    const row = page.locator('tr', { hasText: TEST_COLOR });
    await row.locator('.btn-outline-info').click();
    await expect(page.locator('.modal.show')).toBeVisible();
    const colorInput = page.getByLabel('Cor da Faixa *');
    await colorInput.clear();
    await colorInput.fill(UPDATED_COLOR);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar faixa.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show')).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.unroute('**/api/Belt/*');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    const cleanupRow = page.locator('tr', { hasText: TEST_COLOR });
    await cleanupRow.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateDialog(page);
    await page.getByLabel('Cor da Faixa *').fill(TEST_COLOR);
    await page.getByLabel('Ordem *').fill(String(TEST_ORDER));
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await page.selectOption('select', '100').catch(() => {});
    await expect(page.getByText(TEST_COLOR)).toBeVisible({ timeout: 10_000 });

    await page.route('**/api/Belt/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir faixa.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_COLOR });
    await row.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir faixa.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(TEST_COLOR)).toBeVisible();

    await page.unroute('**/api/Belt/*');
    await row.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.getByText(TEST_COLOR)).not.toBeVisible({ timeout: 10_000 });
  });
});
