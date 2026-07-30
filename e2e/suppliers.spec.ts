import type { Page } from '@playwright/test';
import { test, expect } from './coverage-fixture';
import { generateValidCpf, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const FIRST_NAME = 'E2E';
const LAST_NAME = `Fornecedor${TS}`;
const FULL_NAME = `${FIRST_NAME} ${LAST_NAME}`;
const CPF = generateValidCpf();
const UPDATED_PHONE = '11999990000';

function cnpjCheckDigit(nums: number[]): number {
  const weights = nums.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = nums.reduce((acc, n, i) => acc + n * weights[i], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Generates a fresh, check-digit-valid CNPJ (digits only). */
function generateValidCnpj(): string {
  const base = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const d1 = cnpjCheckDigit(base);
  const d2 = cnpjCheckDigit([...base, d1]);
  return [...base, d1, d2].join('');
}

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

  test('lista todas as opções de tipo de pessoa', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    const values = await page.locator('select[formControlName="personType"] option:not([disabled])').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values.sort()).toEqual(['company', 'individual'].sort());
  });

  test('cria e exclui um fornecedor (pessoa jurídica)', async ({ page }) => {
    const companyName = `E2E Empresa ${TS}`;
    const cnpj = generateValidCnpj();

    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.locator('select[formControlName="personType"]').selectOption('company');
    await page.locator('#companyName').fill(companyName);
    await page.locator('#companyCnpj').fill(cnpj);
    await page.locator('#companyFoundedIn').fill('2010-01-01');
    await page.locator('#companyEmail').fill(`e2e_empresa_${TS}@teste.com`);

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    const card = page.locator('.supplier-card', { hasText: companyName });
    await expect(card).toBeVisible({ timeout: 8_000 });

    await card.locator('button[title="Excluir"]').click();
    await acceptConfirmDialog(page);
    await expect(card).not.toBeVisible({ timeout: 10_000 });
  });

  test('exige nome, sobrenome, cpf e e-mail antes de habilitar salvar (pessoa física)', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.locator('select[formControlName="personType"]').selectOption('individual');
    await expect(saveButton).toBeDisabled();
    await page.locator('#individualFirstName').fill('Temp');
    await page.locator('#individualLastName').fill('Fornecedor');
    await page.locator('#individualCpf').fill(generateValidCpf());
    await expect(saveButton).toBeDisabled(); // still missing e-mail
    await page.locator('#individualEmail').fill('temp@teste.com');
    await expect(saveButton).toBeEnabled();

    await page.locator('#individualEmail').fill('nao-e-um-email');
    await expect(saveButton).toBeDisabled();
  });

  test('exige razão social, cnpj, data de fundação e e-mail antes de habilitar salvar (pessoa jurídica)', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.locator('select[formControlName="personType"]').selectOption('company');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.locator('#companyName').fill('Empresa Temp');
    await page.locator('#companyCnpj').fill(generateValidCnpj());
    await page.locator('#companyFoundedIn').fill('2010-01-01');
    await expect(saveButton).toBeDisabled(); // still missing e-mail
    await page.locator('#companyEmail').fill('empresa@teste.com');
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Supplier**', (route) => {
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
    await page.route('**/api/Supplier', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar fornecedor.' }) });
      }
      return route.continue();
    });
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.locator('select[formControlName="personType"]').selectOption('individual');
    await page.locator('#individualFirstName').fill('Temp');
    await page.locator('#individualLastName').fill('Fornecedor');
    await page.locator('#individualCpf').fill(generateValidCpf());
    await page.locator('#individualEmail').fill('temp@teste.com');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar fornecedor.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show')).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    const delLastName = `FornecedorDelErr${TS}`;
    await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.locator('select[formControlName="personType"]').selectOption('individual');
    await page.locator('#individualFirstName').fill('E2E');
    await page.locator('#individualLastName').fill(delLastName);
    await page.locator('#individualCpf').fill(generateValidCpf());
    await page.locator('#individualEmail').fill(`e2e_delerr_${TS}@teste.com`);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    const card = page.locator('.supplier-card', { hasText: delLastName });
    await expect(card).toBeVisible({ timeout: 8_000 });

    await page.route('**/api/Supplier/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir fornecedor.' }) });
      }
      return route.continue();
    });
    await card.locator('button[title="Excluir"]').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir fornecedor.' })).toBeVisible({ timeout: 10_000 });
    await expect(card).toBeVisible();

    await page.unroute('**/api/Supplier/*');
    await card.locator('button[title="Excluir"]').click();
    await acceptConfirmDialog(page);
    await expect(card).not.toBeVisible({ timeout: 10_000 });
  });
});
