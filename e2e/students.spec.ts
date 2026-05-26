import { test, expect, Page } from '@playwright/test';

const timestamp = Date.now();
const TEST_USER = `e2e_user_${timestamp}`;
const TEST_EMAIL = `e2e_${timestamp}@teste.com`;
const TEST_FIRST_NAME = 'E2E';
const TEST_LAST_NAME = `Teste${timestamp}`;
const FULL_NAME = `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`;
const UPDATED_PHONE = '11999990000';

async function waitForTableReady(page: Page) {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('table')).toBeVisible();
}

test.describe('Estudantes — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/students');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await waitForTableReady(page);
  });

  test('exibe a lista de estudantes', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Aluno/i })).toBeVisible();
  });

  test('cria, edita e exclui um estudante', async ({ page }) => {
    const table = page.locator('table');

    // ── CREATE ────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.getByLabel('Usuário *').fill(TEST_USER);
    await page.getByLabel('E-mail *').fill(TEST_EMAIL);
    await page.getByLabel('Nome', { exact: true }).fill(TEST_FIRST_NAME);
    await page.getByLabel('Sobrenome', { exact: true }).fill(TEST_LAST_NAME);

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForTableReady(page);

    // ── SEARCH ────────────────────────────────────────────────────────
    await page.getByPlaceholder('Buscar por nome do aluno').fill(TEST_LAST_NAME);
    await waitForTableReady(page);
    await expect(table.getByText(FULL_NAME)).toBeVisible({ timeout: 8_000 });

    // ── EDIT ─────────────────────────────────────────────────────────
    const row = page.locator('tr', { hasText: TEST_LAST_NAME });
    await row.locator('.btn-outline-info').click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.getByLabel('Telefone').fill(UPDATED_PHONE);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForTableReady(page);

    // ── DELETE ────────────────────────────────────────────────────────
    // Clear search and re-search to get a clean table state
    await page.getByPlaceholder('Buscar por nome do aluno').fill('');
    await page.getByPlaceholder('Buscar por nome do aluno').fill(TEST_LAST_NAME);
    await waitForTableReady(page);
    await expect(table.getByText(FULL_NAME)).toBeVisible({ timeout: 8_000 });

    const deleteRow = page.locator('tr', { hasText: TEST_LAST_NAME });
    page.once('dialog', dialog => dialog.accept());
    await deleteRow.locator('.btn-outline-danger').click();

    await expect(table.getByText(FULL_NAME)).not.toBeVisible({ timeout: 10_000 });
  });

  test('busca retorna vazio para texto inexistente', async ({ page }) => {
    await page.getByPlaceholder('Buscar por nome do aluno').fill('__TEXTO_QUE_NAO_EXISTE_ABC123__');
    await expect(page.getByText('Nenhum registro encontrado.')).toBeVisible({ timeout: 8_000 });
  });
});
