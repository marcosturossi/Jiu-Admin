import type { Page } from '@playwright/test';
import { test, expect } from './coverage-fixture';
import { generateValidCpf, acceptConfirmDialog } from './helpers';

const timestamp = Date.now();
const TEST_USER = `e2e_user_${timestamp}`;
const TEST_EMAIL = `e2e_${timestamp}@teste.com`;
// The "Buscar por nome do aluno" box only filters by FirstName server-side
// (confirmed via network capture), so firstName must be unique too — a
// constant "E2E" here meant the search below could never find this specific
// student, so both the edit and delete steps silently ran against nothing.
const TEST_FIRST_NAME = `E2E${timestamp}`;
const TEST_LAST_NAME = `Teste${timestamp}`;
const FULL_NAME = `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`;
const UPDATED_PHONE = '11999990000';
// A fresh, check-digit-valid CPF per run — the previous hardcoded value collided
// with itself across runs whenever an earlier run's cleanup didn't complete,
// silently breaking this test until the DB was manually cleaned up.
const TEST_CPF = generateValidCpf();

// Students page uses a card grid, not a table.
async function waitForGridReady(page: Page) {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
}

test.describe('Estudantes — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/students');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);
  });

  test('exibe a lista de estudantes', async ({ page }) => {
    await expect(page.locator('.students-grid, .text-center.py-5')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Aluno/i })).toBeVisible();
  });

  test('cria, edita e exclui um estudante', async ({ page }) => {
    // ── CREATE ────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.getByLabel('Usuário *').fill(TEST_USER);
    await page.getByLabel('E-mail *').fill(TEST_EMAIL);
    await page.locator('#firstName').fill(TEST_FIRST_NAME);
    await page.locator('#lastName').fill(TEST_LAST_NAME);
    await page.locator('#cpf').fill(TEST_CPF);
    await page.locator('#birthDay').fill('1990-05-15');
    await page.locator('#phoneNumber').fill('11999998888');

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    // ── SEARCH ────────────────────────────────────────────────────────
    await page.getByPlaceholder('Buscar por nome do aluno').fill(TEST_FIRST_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForGridReady(page);
    await expect(page.locator('.student-card__name', { hasText: FULL_NAME })).toBeVisible({ timeout: 8_000 });

    // ── EDIT ─────────────────────────────────────────────────────────
    const card = page.locator('.student-card', { hasText: TEST_LAST_NAME });
    await card.locator('.btn-outline-secondary').click();
    await expect(page.locator('.modal.show')).toBeVisible();

    await page.getByLabel('Telefone').fill(UPDATED_PHONE);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    // ── DELETE ────────────────────────────────────────────────────────
    await page.getByPlaceholder('Buscar por nome do aluno').fill('');
    await page.getByPlaceholder('Buscar por nome do aluno').fill(TEST_FIRST_NAME);
    await page.waitForTimeout(500); // filter debounce
    await waitForGridReady(page);
    await expect(page.locator('.student-card__name', { hasText: FULL_NAME })).toBeVisible({ timeout: 8_000 });

    const deleteCard = page.locator('.student-card', { hasText: TEST_LAST_NAME });
    await deleteCard.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);

    await expect(page.locator('.student-card__name', { hasText: FULL_NAME })).not.toBeVisible({ timeout: 10_000 });
  });

  test('busca retorna vazio para texto inexistente', async ({ page }) => {
    await page.getByPlaceholder('Buscar por nome do aluno').fill('__TEXTO_QUE_NAO_EXISTE_ABC123__');
    await expect(page.getByText('Nenhum aluno encontrado.')).toBeVisible({ timeout: 8_000 });
  });
});
