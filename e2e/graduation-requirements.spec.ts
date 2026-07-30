import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  createTestBelt,
  deleteTestBelt,
  acceptConfirmDialog,
  type TestBelt,
} from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E Requisito ${TS}`;
const UPDATED_DESC = `E2E Requisito Edit ${TS}`;

test.describe('Requisitos de Graduação', () => {
  let sharedBelt: TestBelt;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    sharedBelt = await createTestBelt(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await deleteTestBelt(page, sharedBelt.color);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduation-requirements');
    await waitForTableReady(page);
  });

  test('lista requisitos de graduação', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de requisito de graduação', async ({ page }) => {
    const belt = await createTestBelt(page);

    // CREATE
    await page.goto('/system/graduation-requirements');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Requisito/i);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#description', TEST_DESC);
    await page.fill('#minimumClasses', '30');
    await saveAndWaitModalClose(page);
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

    // CLEANUP
    await deleteTestBelt(page, belt.color);
  });

  test('cria faixa pelo botão "+" ao criar requisito, sem sair do formulário', async ({ page }) => {
    const beltColor = `E2E-Faixa-Req-${Date.now()}`;

    await openCreateModal(page, /Novo Requisito/i);
    await page.locator('button[title="Nova faixa"]').click();
    const nestedModal = page.locator('.modal.show').last();
    await expect(nestedModal).toBeVisible();
    await nestedModal.locator('#color').fill(beltColor);
    await nestedModal.locator('#orderIndex').fill('99');
    await nestedModal.getByRole('button', { name: /Salvar/i }).click();

    await expect(page.locator('.modal.show')).toHaveCount(1, { timeout: 10_000 });
    const selectedLabel = await page.locator('#beltId option:checked').textContent();
    expect(selectedLabel?.trim()).toBe(beltColor);

    await page.fill('#description', TEST_DESC);
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toContainText(beltColor);
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    // CLEANUP
    await deleteTestBelt(page, beltColor);
  });

  test('exige faixa e descrição antes de habilitar salvar; aceita mínimo de aulas zero', async ({ page }) => {
    await openCreateModal(page, /Novo Requisito/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.selectOption('#beltId', { label: sharedBelt.color });
    await expect(saveButton).toBeDisabled(); // still missing description
    await page.fill('#description', 'Requisito Temp');
    await expect(saveButton).toBeEnabled(); // minimumClasses defaults to 0, already valid

    await page.fill('#minimumClasses', '-1');
    await expect(saveButton).toBeDisabled();
    await page.fill('#minimumClasses', '0');
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/GraduationRequirements**', (route) => {
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
    await page.route('**/api/GraduationRequirements', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar requisito.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Requisito/i);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await page.fill('#description', TEST_DESC);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar requisito.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro e permite tentar novamente quando falha ao editar', async ({ page }) => {
    await openCreateModal(page, /Novo Requisito/i);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await page.fill('#description', TEST_DESC);
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.route('**/api/GraduationRequirements/*', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao editar requisito.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#description', UPDATED_DESC);
    const saveButton = page.getByRole('button', { name: /Salvar|Atualizar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao editar requisito.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await page.unroute('**/api/GraduationRequirements/*');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Requisito/i);
    await page.selectOption('#beltId', { label: sharedBelt.color });
    await page.fill('#description', TEST_DESC);
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.route('**/api/GraduationRequirements/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir requisito.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_DESC });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir requisito.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table').getByText(TEST_DESC)).toBeVisible();

    await page.unroute('**/api/GraduationRequirements/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
