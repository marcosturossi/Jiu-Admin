import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_NAME = `Academia-E2E-${TS}`;
const TEST_SLUG = `academia-e2e-${TS}`;
const TEST_EMAIL = `e2e-${TS}@test.com`;
const UPDATED_NAME = `Academia-E2E-Edit-${TS}`;

test.describe('Academias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/academies');
    await waitForTableReady(page);
  });

  test('lista academias', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test.skip('CRUD completo de academia — criação retorna 403 (operação de super-admin)', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Academia/i);
    await page.fill('#name', TEST_NAME);
    await page.fill('#slug', TEST_SLUG);
    await page.fill('#adminEmail', TEST_EMAIL);
    await page.fill('#adminFirstName', 'E2E');
    await page.fill('#adminLastName', 'Teste');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_NAME)).toBeVisible();

    // EDIT
    const row = page.locator('tr', { hasText: TEST_NAME });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#name', UPDATED_NAME);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).toBeVisible();

    // DELETE
    const updatedRow = page.locator('tr', { hasText: UPDATED_NAME });
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_NAME)).not.toBeVisible();
  });
});
