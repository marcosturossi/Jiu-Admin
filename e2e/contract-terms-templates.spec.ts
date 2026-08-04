import { Page } from '@playwright/test';
import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_NAME = `Modelo-E2E-${TS}`;
const UPDATED_NAME = `Modelo-E2E-Edit-${TS}`;

/** ngx-quill renders a contenteditable `.ql-editor` div inside the `#text` host element, not a
 *  plain textarea — page.fill() needs to target that inner element directly. */
async function fillQuillEditor(page: Page, text: string): Promise<void> {
  await page.locator('#text .ql-editor').fill(text);
}

test.describe('Modelos de Contrato', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/contract-terms-templates');
    await waitForTableReady(page);
  });

  test('lista modelos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de modelo de contrato', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Modelo/i);
    await page.fill('#name', TEST_NAME);
    await fillQuillEditor(page, 'Cláusulas de teste E2E.');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_NAME });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Cláusulas de teste E2E.');

    // EDIT
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#name', UPDATED_NAME);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const updatedRow = page.locator('tr', { hasText: UPDATED_NAME });
    await expect(updatedRow).toBeVisible();

    // DELETE
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).not.toBeVisible();
  });

  test('formata texto em negrito e persiste após salvar e reabrir', async ({ page }) => {
    const boldName = `Modelo-E2E-Bold-${TS}`;
    await openCreateModal(page, /Novo Modelo/i);
    await page.fill('#name', boldName);

    const editor = page.locator('#text .ql-editor');
    await editor.click();
    await page.keyboard.type('Cláusula em negrito');
    await editor.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await page.locator('#text .ql-toolbar button.ql-bold').click();

    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: boldName });
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(page.locator('#text .ql-editor strong')).toContainText('Cláusula em negrito');

    // Cleanup — this test doesn't reuse TEST_NAME, so it must delete its own row.
    await page.locator('.btn-close').click();
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exige nome e cláusulas antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Novo Modelo/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.fill('#name', 'Nome Temporário');
    await expect(saveButton).toBeDisabled();

    await fillQuillEditor(page, 'Texto temporário');
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/ContractTermsTemplate**', (route) => {
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
    await page.route('**/api/ContractTermsTemplate', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar modelo.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Modelo/i);
    await page.fill('#name', TEST_NAME);
    await fillQuillEditor(page, 'Texto');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar modelo.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Modelo/i);
    await page.fill('#name', TEST_NAME);
    await fillQuillEditor(page, 'Texto');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_NAME)).toBeVisible();

    await page.route('**/api/ContractTermsTemplate/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir modelo.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir modelo.' })).toBeVisible({ timeout: 10_000 });

    await page.unroute('**/api/ContractTermsTemplate/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
