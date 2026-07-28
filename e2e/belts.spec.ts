import { test, expect, Page } from '@playwright/test';
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
});
