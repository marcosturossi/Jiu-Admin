import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, acceptConfirmDialog } from './helpers';

const TS = Date.now();
const TEST_TITLE = `Horario-E2E-${TS}`;
const UPDATED_TITLE = `Horario-E2E-Edit-${TS}`;

test.describe('Grade de Horários', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/lesson-schedules');
    await waitForTableReady(page);
  });

  test('lista horários', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('CRUD completo de horário recorrente', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Horário/i);
    await page.fill('#title', TEST_TITLE);
    await page.selectOption('#dayOfWeek', 'Wednesday');
    await page.fill('#startTime', '19:00');
    await page.fill('#duration', '01:30');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: TEST_TITLE });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Quarta-feira');
    await expect(row).toContainText('19:00');

    // EDIT
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#title', UPDATED_TITLE);
    await page.selectOption('#dayOfWeek', 'Friday');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const updatedRow = page.locator('tr', { hasText: UPDATED_TITLE });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Sexta-feira');

    // DELETE
    await updatedRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(UPDATED_TITLE)).not.toBeVisible();
  });

  test('exige título, dia da semana, horário e duração antes de habilitar salvar', async ({ page }) => {
    await openCreateModal(page, /Novo Horário/i);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await expect(saveButton).toBeDisabled();

    await page.fill('#title', 'Título Temporário');
    await expect(saveButton).toBeEnabled(); // dayOfWeek/startTime/duration already have defaults
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/LessonSchedule**', (route) => {
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
    await page.route('**/api/LessonSchedule', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao criar horário.' }) });
      }
      return route.continue();
    });
    await openCreateModal(page, /Novo Horário/i);
    await page.fill('#title', TEST_TITLE);
    const saveButton = page.getByRole('button', { name: /Salvar/i });
    await saveButton.click();
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao criar horário.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    await openCreateModal(page, /Novo Horário/i);
    await page.fill('#title', TEST_TITLE);
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(page.locator('table').getByText(TEST_TITLE)).toBeVisible();

    await page.route('**/api/LessonSchedule/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir horário.' }) });
      }
      return route.continue();
    });
    const row = page.locator('tr', { hasText: TEST_TITLE });
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir horário.' })).toBeVisible({ timeout: 10_000 });

    await page.unroute('**/api/LessonSchedule/*');
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
  });
});
