import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, saveAndWaitModalClose, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E-Receber-${TS}`;

test.describe('Contas a Receber', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/accounts-receivable');
    await waitForTableReady(page);
  });

  test('lista contas a receber', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria conta a receber e confirma que exclusão de item avulso falha (bug conhecido)', async ({ page }) => {
    // CREATE — standalone, no contract/student prerequisite (type defaults to Receita)
    await openCreateModal(page, /Nova Conta a Receber/i);
    await page.fill('#description', TEST_DESC);
    await page.fill('#amount', '99.90');
    await page.fill('#transactionDate', '2030-06-15');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    // This list isn't sorted newest-first, and the "Buscar conta a receber"
    // box only filters by type (not free text — another dead-search bug), so
    // with enough accumulated rows the new one can land off page 1. Bump the
    // page size to the max instead of assuming page 1.
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);
    const row = page.locator('tr', { hasText: TEST_DESC });
    await expect(row).toBeVisible();

    // DELETE — the component always calls apiAccountsReceivableChargeIdDelete
    // (DELETE /api/AccountsReceivable/charge/{id}), which is the endpoint for
    // contract-generated installments. For a standalone entry like this one
    // (not linked to a contract), that id isn't a valid charge id, so the
    // backend 404s and the row is never removed — confirmed via network
    // inspection. This looks like a real bug (should call
    // apiAccountsReceivableIdDelete for non-charge entries); asserting the
    // current behavior here so it surfaces if/when it's fixed. The toast now
    // surfaces the real backend detail ("Not Found") instead of a generic
    // message, since NotificationService errors were wired to
    // extractErrorMessage().
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.getByText('Not Found')).toBeVisible({ timeout: 10_000 });
    await expect(row).toBeVisible();
  });
});
