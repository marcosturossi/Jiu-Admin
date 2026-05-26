import { test, expect } from '@playwright/test';
import { waitForTableReady, selectFromSearchSelect } from './helpers';

test.describe('Mensalidades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/monthly-fees');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
    await waitForTableReady(page);
  });

  test('exibe a lista de mensalidades sem botão de criação', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Mensalidade/i })).not.toBeVisible();
  });

  test('filtra por status Pendente', async ({ page }) => {
    await page.locator('.filter-bar__advanced').click();
    const modal = page.locator('.modal.show').last();
    await modal.getByRole('button', { name: /Adicionar condição/i }).click();
    await modal.locator('select.condition-row__value').selectOption({ label: 'Pendente' });
    await modal.locator('.modal-footer .btn-primary').click();
    await waitForTableReady(page);
    // All visible status badges should be "Pendente"
    const badges = page.locator('table tbody .badge');
    const count = await badges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).innerText();
        expect(text.trim()).toBe('Pendente');
      }
    }
  });

  test('filtra por status Pago', async ({ page }) => {
    await page.locator('.filter-bar__advanced').click();
    const modal = page.locator('.modal.show').last();
    await modal.getByRole('button', { name: /Adicionar condição/i }).click();
    await modal.locator('select.condition-row__value').selectOption({ label: 'Pago' });
    await modal.locator('.modal-footer .btn-primary').click();
    await waitForTableReady(page);
    const badges = page.locator('table tbody .badge');
    const count = await badges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).innerText();
        expect(text.trim()).toBe('Pago');
      }
    }
  });

  test('busca retorna vazio para aluno inexistente', async ({ page }) => {
    await page.fill('input[placeholder="Buscar mensalidade"]', '__NAO_EXISTE_ALUNO_ABC999__');
    await page.waitForTimeout(600);
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 8_000 });
  });

  test('registra pagamento de mensalidade pendente', async ({ page }) => {
    // Filter to Pending fees only so we have something to pay
    await page.locator('.filter-bar__advanced').click();
    const modal = page.locator('.modal.show').last();
    await modal.locator('.modal-body .btn-outline-secondary').click();
    await modal.locator('select.condition-row__value').selectOption({ label: 'Pendente' });
    await modal.locator('.modal-footer .btn-primary').click();
    await waitForTableReady(page);

    const payButton = page.locator('button[title="Registrar Pagamento"]').first();
    const payButtonCount = await payButton.count();
    if (payButtonCount === 0) {
      test.skip(); // No pending fees available — skip gracefully
      return;
    }

    await payButton.click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    // Fill payment form
    await page.fill('#paidAmount', '150.00');
    await page.fill('#paidAt', '2030-01-15');

    await page.getByRole('button', { name: /Confirmar|Registrar|Salvar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
  });
});
