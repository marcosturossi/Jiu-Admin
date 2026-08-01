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

test.describe('Alunos — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/students');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);
  });

  test('exibe a lista de alunos', async ({ page }) => {
    await expect(page.locator('.students-grid, .text-center.py-5')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Aluno/i })).toBeVisible();
  });

  test('cria, edita e exclui um aluno', async ({ page }) => {
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
    await card.locator('.btn-outline-info').click();
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

  test('exige usuário, e-mail, nome, sobrenome, nascimento, cpf e telefone antes de habilitar salvar', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.getByLabel('Usuário *').fill('temp_user');
    await page.getByLabel('E-mail *').fill('temp@teste.com');
    await page.locator('#firstName').fill('Temp');
    await page.locator('#lastName').fill('User');
    await page.locator('#cpf').fill(generateValidCpf());
    await page.locator('#birthDay').fill('1990-05-15');
    await page.locator('#phoneNumber').fill('11999998888');
    await expect(saveButton).toBeEnabled();

    await page.getByLabel('E-mail *').fill('nao-e-um-email');
    await expect(saveButton).toBeDisabled();
  });

  test('exige ao menos um responsável para aluno menor de idade', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();

    const minorTs = Date.now();
    await page.getByLabel('Usuário *').fill(`e2e_minor_${minorTs}`);
    await page.getByLabel('E-mail *').fill(`e2e_minor_${minorTs}@teste.com`);
    await page.locator('#firstName').fill('Menor');
    await page.locator('#lastName').fill(`DeIdade${minorTs}`);
    await page.locator('#cpf').fill(generateValidCpf());
    // A birthdate well within the last 10 years, guaranteed to be a minor regardless of today's date.
    const minorYear = new Date().getFullYear() - 10;
    await page.locator('#birthDay').fill(`${minorYear}-01-01`);
    await page.locator('#phoneNumber').fill('11999998888');

    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeEnabled(); // client-side form validators alone don't require a responsible
    await saveButton.click();
    await expect(page.getByText('Alunos menores de idade precisam de ao menos um responsável vinculado.')).toBeVisible({ timeout: 5_000 });
    // No request should have gone through — modal stays open.
    await expect(page.locator('.modal.show')).toBeVisible();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Students**', (route) => {
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
    await page.route('**/api/Students', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar aluno.' }) });
      }
      return route.continue();
    });
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.getByLabel('Usuário *').fill(TEST_USER);
    await page.getByLabel('E-mail *').fill(TEST_EMAIL);
    await page.locator('#firstName').fill(TEST_FIRST_NAME);
    await page.locator('#lastName').fill(TEST_LAST_NAME);
    await page.locator('#cpf').fill(TEST_CPF);
    await page.locator('#birthDay').fill('1990-05-15');
    await page.locator('#phoneNumber').fill('11999998888');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar aluno.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show')).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe badge de confirmação pendente e permite reenviar', async ({ page }) => {
    const ts = Date.now();
    const firstName = `E2EVerify${ts}`;
    const lastName = `Aux${ts}`;
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.getByLabel('Usuário *').fill(`e2e_verify_${ts}`);
    await page.getByLabel('E-mail *').fill(`e2e_verify_${ts}@teste.com`);
    await page.locator('#firstName').fill(firstName);
    await page.locator('#lastName').fill(lastName);
    await page.locator('#cpf').fill(generateValidCpf());
    await page.locator('#birthDay').fill('1990-05-15');
    await page.locator('#phoneNumber').fill('11999998888');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    await page.getByPlaceholder('Buscar por nome do aluno').fill(firstName);
    await page.waitForTimeout(500);
    await waitForGridReady(page);
    const card = page.locator('.student-card', { hasText: lastName });
    await expect(card).toBeVisible({ timeout: 8_000 });

    // A brand-new student has no Keycloak account yet — pending confirmation.
    await expect(card.getByText('Aguardando confirmação')).toBeVisible();
    await expect(card.locator('button[title="Reenviar confirmação"]')).toBeVisible();

    await card.locator('button[title="Reenviar confirmação"]').click();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    const ts = Date.now();
    const firstName = `E2EDelErr${ts}`;
    const lastName = `Aux${ts}`;
    await page.getByRole('button', { name: /Novo Aluno/i }).click();
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.getByLabel('Usuário *').fill(`e2e_delerr_${ts}`);
    await page.getByLabel('E-mail *').fill(`e2e_delerr_${ts}@teste.com`);
    await page.locator('#firstName').fill(firstName);
    await page.locator('#lastName').fill(lastName);
    await page.locator('#cpf').fill(generateValidCpf());
    await page.locator('#birthDay').fill('1990-05-15');
    await page.locator('#phoneNumber').fill('11999998888');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });
    await waitForGridReady(page);

    await page.getByPlaceholder('Buscar por nome do aluno').fill(firstName);
    await page.waitForTimeout(500);
    await waitForGridReady(page);
    const card = page.locator('.student-card', { hasText: lastName });
    await expect(card).toBeVisible({ timeout: 8_000 });

    await page.route('**/api/Students/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir aluno.' }) });
      }
      return route.continue();
    });
    await card.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir aluno.' })).toBeVisible({ timeout: 10_000 });
    await expect(card).toBeVisible();

    await page.unroute('**/api/Students/*');
    await card.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(card).not.toBeVisible({ timeout: 10_000 });
  });
});
