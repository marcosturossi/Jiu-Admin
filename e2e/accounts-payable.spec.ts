import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, saveAndWaitModalClose, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_DESC = `E2E-Pagar-${TS}`;

test.describe('Contas a Pagar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/accounts-payable');
    await waitForTableReady(page);
  });

  test('lista contas a pagar', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui conta a pagar', async ({ page }) => {
    // CREATE — standalone, no supplier/contract prerequisite
    await openCreateModal(page, /Nova Conta a Pagar/i);
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
});
