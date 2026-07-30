import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  acceptConfirmDialog,
  createTestStudent,
  deleteTestStudent,
  type TestStudent,
} from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E-Receber-${TS}`;

test.describe('Contas a Receber', () => {
  // A student (Person) is required by the backend to create an entry — shared
  // across tests here since it's just a lookup value, not something any
  // individual test owns or mutates.
  let student: TestStudent;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    student = await createTestStudent(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await deleteTestStudent(page, student.firstName);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/accounts-receivable');
    await waitForTableReady(page);
  });

  test('lista contas a receber', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui conta a receber avulsa', async ({ page }) => {
    // CREATE — standalone (no contract), just linked to a student.
    // Fixed bug: delete() used to always call the charge-delete endpoint
    // (apiAccountsReceivableChargeIdDelete), which only exists for
    // contract-generated installments — standalone entries (contractId null)
    // always 404d and were never actually removable. It now branches on
    // item.contractId and calls apiAccountsReceivableIdDelete for these.
    await openCreateModal(page, /Nova Conta a Receber/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '99.90');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    // This list isn't sorted newest-first, and the "Buscar conta a receber"
    // box only filters by type (not free text — a separate, pre-existing dead-
    // search issue), so with enough accumulated rows the new one can land off
    // page 1. Bump the page size to the max instead of assuming page 1.
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);
    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });

  test('exige aluno, tipo, valor, data e vencimento antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Receber/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    // type/transactionDate/dueDate all default, so aluno + amount are missing initially.
    await expect(saveButton).toBeDisabled();
    await page.fill('#amount', '50');
    await expect(saveButton).toBeDisabled(); // still missing aluno
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await expect(saveButton).toBeEnabled();
    await page.fill('#amount', '0');
    await expect(saveButton).toBeDisabled();
  });

  test('lista todas as opções de tipo de transação', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Receber/i);
    const values = await page.locator('#type option:not([disabled])').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values.sort()).toEqual(['Adjustment', 'Income', 'Refund'].sort());
  });

  test('paga com dinheiro, esconde o reembolso (não reembolsável) e baixa recibo', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Receber/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '120.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    // PAY WITH MONEY
    await row.locator('button.btn-outline-primary').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);
    await expect(row).toContainText('Pago');
    await expect(row.locator('button.btn-outline-primary')).not.toBeVisible();
    // Manual cash payments never get an externalChargeId, so the backend
    // rejects refunding them ("is not refundable") — the button must stay hidden.
    await expect(row.locator('button.btn-outline-warning')).not.toBeVisible();
    await expect(row.locator('button[title="Baixar Recibo"]')).toBeVisible();

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });

  test('reembolsa uma cobrança paga via gateway, com confirmação por texto (mockado)', async ({ page }) => {
    // Refunding a real gateway charge would require an actual Asaas-processed
    // payment, which this suite can't produce — mock a Paid income row with an
    // externalChargeId (the actual refundability condition) to exercise the
    // confirm-by-typing UX and the success path in isolation.
    const mockItem = {
      id: '00000000-0000-0000-0000-0000000000aa',
      type: 'Income',
      status: 'Paid',
      externalChargeId: 'ext_mock_charge',
      transactionCategoryName: 'Mensalidade',
      personName: 'Mock Student',
      description: 'Mensalidade Mock',
      amount: 200,
      dueDate: '2030-01-01',
      transactionDate: '2030-01-01',
    };
    await page.route('**/api/AccountsReceivable**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [mockItem], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }),
        });
      }
      return route.continue();
    });
    await page.route('**/api/AccountsReceivable/*/refund', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ ...mockItem, status: 'Refunded' }),
    }));

    await page.reload();
    await waitForTableReady(page);
    const row = page.locator('tr', { hasText: 'Mensalidade Mock' });
    await expect(row).toBeVisible();

    await row.locator('button.btn-outline-warning').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const refundButton = page.getByRole('button', { name: /Confirmar reembolso/i });
    await expect(refundButton).toBeDisabled();
    await page.locator('input[name="confirmationInput"]').fill('errado');
    await expect(refundButton).toBeDisabled();
    await page.locator('input[name="confirmationInput"]').fill('reembolso');
    await expect(refundButton).toBeEnabled();
    await refundButton.click();
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro quando a API rejeita um reembolso não permitido', async ({ page }) => {
    const mockItem = {
      id: '00000000-0000-0000-0000-0000000000bb',
      type: 'Income',
      status: 'Paid',
      externalChargeId: 'ext_mock_charge_2',
      transactionCategoryName: 'Mensalidade',
      description: 'Mensalidade Mock Erro',
      amount: 150,
      dueDate: '2030-01-01',
      transactionDate: '2030-01-01',
    };
    await page.route('**/api/AccountsReceivable**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [mockItem], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }),
        });
      }
      return route.continue();
    });
    await page.route('**/api/AccountsReceivable/*/refund', (route) => route.fulfill({
      status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'FinancialTransaction is not refundable.' }),
    }));

    await page.reload();
    await waitForTableReady(page);
    const row = page.locator('tr', { hasText: 'Mensalidade Mock Erro' });
    await row.locator('button.btn-outline-warning').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.locator('input[name="confirmationInput"]').fill('reembolso');
    await page.getByRole('button', { name: /Confirmar reembolso/i }).click();
    await expect(page.locator('.toast-error', { hasText: 'is not refundable' })).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro quando falha o pagamento com dinheiro', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Receber/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '45.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await page.route('**/api/AccountsReceivable/*/confirm-payment-money', (route) => route.fulfill({
      status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao confirmar pagamento.' }),
    }));

    await row.locator('button.btn-outline-primary').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const payButton = page.getByRole('button', { name: /Salvar/i });
    await payButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao confirmar pagamento.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(payButton).toBeEnabled();
    await page.unroute('**/api/AccountsReceivable/*/confirm-payment-money');
    await page.locator('.modal.show button.btn-danger', { hasText: 'Fechar' }).click();

    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exibe erro quando falha ao criar', async ({ page }) => {
    await page.route('**/api/AccountsReceivable', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar conta a receber.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Nova Conta a Receber/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#amount', '10');
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar conta a receber.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/AccountsReceivable**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Nova Conta a Receber/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '20.00');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_DESC });
    await page.route('**/api/AccountsReceivable/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir.' }) });
      }
      return route.continue();
    });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir.' })).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();

    await page.unroute('**/api/AccountsReceivable/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
