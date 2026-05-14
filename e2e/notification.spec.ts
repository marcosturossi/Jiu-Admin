import { test, expect } from '@playwright/test';
import { waitForTableReady } from './helpers';

const TS = Date.now();
const TEST_TITLE = `E2E Notif ${TS}`;
const TEST_MESSAGE = `Mensagem de teste E2E ${TS}`;
const UPDATED_TITLE = `E2E Notif Editado ${TS}`;

test.describe('Notificações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/notification');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await waitForTableReady(page);
  });

  test('exibe a lista de notificações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Notificação/i })).toBeVisible();
  });

  test('CRUD completo de notificação', async ({ page }) => {
    // ── CREATE ─────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    await page.fill('#title', TEST_TITLE);
    await page.fill('#message', TEST_MESSAGE);
    await page.selectOption('#type', { label: 'Informação' });

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible({ timeout: 8_000 });

    // ── SEARCH ─────────────────────────────────────────────────────────
    await page.fill('input[placeholder="Buscar notificação"]', TEST_TITLE);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible({ timeout: 8_000 });

    // ── EDIT ──────────────────────────────────────────────────────────
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-info').first().click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    await page.fill('#title', UPDATED_TITLE);
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar notificação"]', UPDATED_TITLE);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).toBeVisible({ timeout: 8_000 });

    // ── DELETE ────────────────────────────────────────────────────────
    const updatedRow = page.locator('tr', { hasText: UPDATED_TITLE });
    page.once('dialog', d => d.accept());
    await updatedRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).not.toBeVisible({ timeout: 10_000 });
  });

  test('busca retorna vazio para texto inexistente', async ({ page }) => {
    await page.fill('input[placeholder="Buscar notificação"]', '__NAO_EXISTE_ABC123__');
    await expect(page.getByText('Nenhum registro encontrado.')).toBeVisible({ timeout: 8_000 });
  });

  test('cria notificação com data de expiração', async ({ page }) => {
    const titleWithExpiry = `E2E Expiry ${TS}`;

    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    await page.fill('#title', titleWithExpiry);
    await page.fill('#message', 'Mensagem com expiração');
    await page.fill('#expiresAt', '2030-12-31T23:59');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    await page.fill('input[placeholder="Buscar notificação"]', titleWithExpiry);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(titleWithExpiry)).toBeVisible({ timeout: 8_000 });

    // Cleanup
    const row = page.locator('tr', { hasText: titleWithExpiry });
    page.once('dialog', d => d.accept());
    await row.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });
});
