import { test, expect } from './coverage-fixture';
import { waitForTableReady, acceptConfirmDialog } from './helpers';

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

  // Previously skipped: NotificationComponent.load() assumed apiNotificationGet()
  // resolves to a bare array (its generated TS signature), but the live backend
  // actually returns an OData-shaped { value: [...], count: N } object —
  // confirmed via network capture. That corrupted the `items` signal and threw
  // "newCollection[Symbol.iterator] is not a function" the moment anything
  // triggered change detection on this page. Fixed in notification.component.ts
  // to handle both shapes (and use the real `count` for pagination when present).
  test('CRUD completo de notificação', async ({ page }) => {
    // ── CREATE ─────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    await page.fill('#title', TEST_TITLE);
    await page.selectOption('#type', 'Info');
    await page.fill('#message', TEST_MESSAGE);

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
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).not.toBeVisible({ timeout: 10_000 });
  });

  test('busca retorna vazio para texto inexistente', async ({ page }) => {
    await page.fill('input[placeholder="Buscar notificação"]', '__NAO_EXISTE_ABC123__');
    // Wait for debounce (400ms) + API response
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 8_000 });
  });

  test('cria notificação com data de expiração', async ({ page }) => {
    const titleWithExpiry = `E2E Expiry ${TS}`;

    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    await page.fill('#title', titleWithExpiry);
    await page.selectOption('#type', 'Info');
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
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });

  test('exige título e mensagem antes de habilitar salvar', async ({ page }) => {
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const saveButton = page.getByRole('button', { name: /Salvar|Criar/i });
    await expect(saveButton).toBeDisabled(); // type already defaults to Info

    await page.fill('#title', 'Título Temp');
    await expect(saveButton).toBeDisabled();
    await page.fill('#message', 'Mensagem Temp');
    await expect(saveButton).toBeEnabled();
  });

  test('lista todos os tipos de notificação', async ({ page }) => {
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    const values = await page.locator('#type option:not([disabled])').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values.sort()).toEqual(
      ['Info', 'Success', 'Warning', 'Error', 'Graduation', 'Lesson', 'Payment', 'System'].sort(),
    );
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Notification**', (route) => {
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
    await page.route('**/api/Notification', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar notificação.' }) });
      }
      return route.continue();
    });
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#title', TEST_TITLE);
    await page.selectOption('#type', 'Info');
    await page.fill('#message', TEST_MESSAGE);
    const saveButton = page.getByRole('button', { name: /Salvar|Criar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar notificação.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await page.getByRole('button', { name: /Nova Notificação/i }).click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#title', TEST_TITLE);
    await page.selectOption('#type', 'Info');
    await page.fill('#message', TEST_MESSAGE);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible({ timeout: 8_000 });

    await page.route('**/api/Notification/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir notificação.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir notificação.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    await page.unroute('**/api/Notification/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
