import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  acceptConfirmDialog,
  createTestSupplier,
  deleteTestSupplier,
  type TestSupplier,
} from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E-Pagar-${TS}`;

test.describe('Contas a Pagar', () => {
  // A supplier (Person) is now required by the backend to create an entry —
  // shared across tests here since it's just a lookup value, not something
  // any individual test owns or mutates.
  let supplier: TestSupplier;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    supplier = await createTestSupplier(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await deleteTestSupplier(page, supplier.lastName);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/accounts-payable');
    await waitForTableReady(page);
  });

  test('lista contas a pagar', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui conta a pagar', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '49.90');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });

  test('exige fornecedor, valor, data e vencimento antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    // transactionDate/dueDate default to today, so only fornecedor + amount are missing initially.
    await expect(saveButton).toBeDisabled();

    await page.fill('#amount', '50');
    await expect(saveButton).toBeDisabled(); // still missing fornecedor

    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await expect(saveButton).toBeEnabled();

    await page.fill('#transactionDate', '');
    await expect(saveButton).toBeDisabled();
  });

  test('exige valor mínimo de R$ 0,01', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#amount', '0');
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeDisabled();
    await page.fill('#amount', '0.01');
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });

  test('registra pagamento com sucesso, prefilling o valor, e exclui em seguida', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '75.50');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    await row.locator('button.btn-outline-primary').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(page.locator('#paidAmount')).toHaveValue('75.5');
    await page.getByRole('button', { name: /Confirmar Pagamento/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(row).toContainText('Pago');
    await expect(row.locator('button.btn-outline-primary')).not.toBeVisible(); // pay action hidden once paid

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro e não marca como pago quando o pagamento falha', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '30.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    await page.route('**/api/AccountsPayable/*/pay', (route) => route.fulfill({
      status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao registrar pagamento.' }),
    }));

    await row.locator('button.btn-outline-primary').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const payButton = page.getByRole('button', { name: /Confirmar Pagamento/i });
    await payButton.click();

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao registrar pagamento.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(payButton).toBeEnabled();
    await page.unroute('**/api/AccountsPayable/*/pay');
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(row).not.toContainText('Pago');

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exibe erro quando falha ao criar', async ({ page }) => {
    await page.route('**/api/AccountsPayable', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar conta a pagar.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#amount', '10');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar conta a pagar.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/AccountsPayable**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });

  test('cria categoria pelo botão "+" ao criar conta a pagar, sem sair do formulário', async ({ page }) => {
    const categoryName = `Categoria-E2E-Pagar-${Date.now()}`;

    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);

    await page.locator('button[title="Nova categoria"]').click();
    const nestedModal = page.locator('.modal.show').last();
    await expect(nestedModal).toBeVisible();
    await nestedModal.locator('#name').fill(categoryName);
    await nestedModal.getByRole('button', { name: /Salvar/i }).click();

    // Nested modal closes, outer create-payable modal stays open, new category selected.
    await expect(page.locator('.modal.show')).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator('.search-select-trigger', { hasText: categoryName })).toBeVisible();

    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '20.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();
    await expect(row).toContainText(categoryName);

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    // CLEANUP — category
    await page.goto('/system/transaction-categories');
    await waitForTableReady(page);
    const categoryRow = page.locator('tr', { hasText: categoryName });
    await categoryRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Pagar/i);
    await selectFromSearchSelect(page, 'Fornecedor', supplier.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '15.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await page.route('**/api/AccountsPayable/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir.' })).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();

    await page.unroute('**/api/AccountsPayable/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
