import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog, loginAsSuperAdmin } from './helpers';
import type { Page } from '@playwright/test';

const TS = Date.now();
const TEST_NAME = `Academia-E2E-${TS}`;
const TEST_SLUG = `academia-e2e-${TS}`;
const TEST_EMAIL = `e2e-${TS}@test.com`;
const UPDATED_NAME = `Academia-E2E-Edit-${TS}`;

// The whole /api/admin/academies surface (list included, not just mutations) is gated at the
// middleware level (TenantResolverMiddleware logs "Access denied to admin route ... for
// non-superadmin") — so every test in this file runs against a dedicated superadmin login
// (E2E_SUPERADMIN_USER in e2e/.env), not the suite-wide tenant-admin E2E_USER session.
test.describe('Academias', () => {
  let page: Page;
  let close: (() => Promise<void>) | undefined;

  test.beforeEach(async ({ browser }) => {
    ({ page, close } = await loginAsSuperAdmin(browser));
    await page.goto('/system/academies');
    await waitForTableReady(page);
  });

  test.afterEach(async () => {
    await close?.();
  });

  test('lista academias', async () => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  });

  test('superadmin é redirecionado de /system/home para /system/academies', async () => {
    await page.goto('/system/home');
    await page.waitForURL(/\/system\/academies$/, { timeout: 10_000 });
    await expect(page.locator('table')).toBeVisible();
  });

  test.describe('Configurações de Pagamento da Academia', () => {
    test('abre e fecha o modal de configurações de pagamento pela primeira academia da lista', async () => {
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button[title="Configurações de Pagamento"]').click();

      const modal = page.locator('.modal.show').first();
      await expect(modal).toBeVisible();
      await expect(modal.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
      await expect(modal.locator('#asaasWalletId')).toBeVisible();
      await expect(modal.locator('#splitType')).toBeVisible();

      await modal.getByRole('button', { name: /Cancelar/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('alterna os campos exibidos conforme o tipo de split selecionado', async () => {
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button[title="Configurações de Pagamento"]').click();

      const modal = page.locator('.modal.show').first();
      await expect(modal.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });

      await modal.locator('#splitType').selectOption('Percentage');
      await expect(modal.locator('#splitPercentualValue')).toBeVisible();
      await expect(modal.locator('#splitFixedValue')).not.toBeVisible();

      await modal.locator('#splitType').selectOption('FixedValue');
      await expect(modal.locator('#splitFixedValue')).toBeVisible();
      await expect(modal.locator('#splitPercentualValue')).not.toBeVisible();

      await modal.getByRole('button', { name: /Cancelar/i }).click();
    });

    test('exige a carteira Asaas (Wallet ID) para salvar', async () => {
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button[title="Configurações de Pagamento"]').click();

      const modal = page.locator('.modal.show').first();
      await expect(modal.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });

      await modal.locator('#asaasWalletId').fill('');
      await modal.locator('#splitType').selectOption('Percentage');
      await modal.locator('#splitPercentualValue').fill('10');
      await modal.getByRole('button', { name: /Salvar/i }).click();

      await expect(modal.locator('.invalid-feedback', { hasText: 'obrigatório' })).toBeVisible();
      await expect(modal).toBeVisible();

      await modal.getByRole('button', { name: /Cancelar/i }).click();
    });

    test('aceita 0 como valor de split e salva a forma de pagamento padrão da academia', async () => {
      // DefaultBillingType lives on the same TenantSettings row the tenant's own self-service
      // payment-settings page reads (see payment-settings.spec.ts) — snapshot and restore it so
      // this test doesn't leave cross-file state behind. AsaasWalletId/split fields aren't read
      // by any other spec, so those are left as whatever this test sets.
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button[title="Configurações de Pagamento"]').click();

      const modal = page.locator('.modal.show').first();
      await expect(modal.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
      const originalDefaultBillingType = await modal.locator('#defaultBillingType').inputValue();

      await modal.locator('#asaasWalletId').fill('wallet-e2e-teste');
      await modal.locator('#splitType').selectOption('Percentage');
      await modal.locator('#splitPercentualValue').fill('0');
      await modal.locator('#defaultBillingType').selectOption('PIX');
      await modal.getByRole('button', { name: /Salvar/i }).click();

      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

      await firstRow.locator('button[title="Configurações de Pagamento"]').click();
      const reopened = page.locator('.modal.show').first();
      await expect(reopened.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
      await expect(reopened.locator('#splitPercentualValue')).toHaveValue('0');
      await expect(reopened.locator('#defaultBillingType')).toHaveValue('PIX');

      await reopened.locator('#defaultBillingType').selectOption(originalDefaultBillingType);
      await reopened.getByRole('button', { name: /Salvar/i }).click();
      await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    });
  });

  // Not re-verified against the new superadmin account: CreateAcademyUseCase calls the Keycloak
  // admin API to provision a real user for the new academy, and this environment's
  // prod-vs-dev status hasn't been confirmed — skip until that's settled rather than risk writing
  // real Keycloak/DB state.
  test.skip('CRUD completo de academia', async () => {
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
