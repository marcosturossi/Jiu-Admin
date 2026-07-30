import type { Page } from '@playwright/test';
import { test, expect } from './coverage-fixture';
import { generateValidCpf, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const FIRST_NAME = 'E2E';
const LAST_NAME = `Fornecedor${TS}`;
const FULL_NAME = `${FIRST_NAME} ${LAST_NAME}`;
const CPF = generateValidCpf();
const UPDATED_PHONE = '11999990000';

// Suppliers page uses a card grid, not a table.
async function waitForGridReady(page: Page) {
  await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
}

test.describe('Fornecedores — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/suppliers');
    await waitForGridReady(page);
  });

  test('exibe a lista de fornecedores', async ({ page }) => {
    await expect(page.locator('.suppliers-grid, .text-center.py-5')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Fornecedor/i })).toBeVisible();
  });

  test('cria, edita e exclui um fornecedor (pessoa física)', async ({ page }) => {
    // ── CREATE ────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.locator('select[formControlName="personType"]').selectOption('individual');
    await page.locator('input[formControlName="firstName"]').fill(FIRST_NAME);
    await page.locator('input[formControlName="lastName"]').fill(LAST_NAME);
    await page.locator('input[formControlName="cpf"]').fill(CPF);
    await page.locator('input[formControlName="email"]').fill(`e2e_fornecedor_${TS}@teste.com`);

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    // ── VERIFY IN LIST ────────────────────────────────────────────────
    await expect(page.locator('.supplier-card__name', { hasText: FULL_NAME })).toBeVisible({ timeout: 8_000 });

    // ── EDIT ─────────────────────────────────────────────────────────
    const card = page.locator('.supplier-card', { hasText: LAST_NAME });
    await card.locator('button[title="Editar"]').click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.locator('input[formControlName="phoneNumber"]').fill(UPDATED_PHONE);
    await page.locator('input[formControlName="email"]').fill(`e2e_fornecedor_${TS}@teste.com`);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    // ── DELETE ────────────────────────────────────────────────────────
    const deleteCard = page.locator('.supplier-card', { hasText: LAST_NAME });
    await deleteCard.locator('button[title="Excluir"]').click();
    await acceptConfirmDialog(page);

    await expect(page.locator('.supplier-card__name', { hasText: FULL_NAME })).not.toBeVisible({ timeout: 10_000 });
  });
});
