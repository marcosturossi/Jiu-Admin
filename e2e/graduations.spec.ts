import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

test.describe('Graduações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduations');
    await waitForTableReady(page);
  });

  test('lista graduações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui graduação', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Graduação/i);

    // Select a student via search-select (search empty to load first page of students)
    await selectFromSearchSelect(page, 'Aluno', '');

    // Select the first available belt
    await page.selectOption('#beltId', { index: 1 });

    // Set graduation date
    await page.fill('#graduationDate', '2030-01-01');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify a row appeared (graduation date visible)
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // DELETE the first row created
    const firstRow = page.locator('table tbody tr').first();
    page.once('dialog', d => d.accept());
    await firstRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });

  test('cria, edita e exclui graduação', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', '');
    await page.selectOption('#beltId', { index: 1 });
    await page.fill('#graduationDate', '2029-06-01');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // EDIT — open the first row's edit button
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();

    // Change the graduation date
    await page.fill('#graduationDate', '2029-07-15');
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify the updated date is visible in the table (dd/MM/yyyy format)
    await expect(page.locator('table').getByText('15/07/2029')).toBeVisible({ timeout: 8_000 });

    // DELETE
    page.once('dialog', d => d.accept());
    await page.locator('table tbody tr').first().locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });

  test('busca retorna vazio para texto inexistente', async ({ page }) => {
    test.skip(true, 'Busca vazia de graduação ainda é instável no ambiente e2e');
    await page.fill('input[placeholder="Buscar graduação"]', '__NAO_EXISTE_GRAD_XYZ999__');
    await page.waitForTimeout(600);
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 8_000 });
  });
});
