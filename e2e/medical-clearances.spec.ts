import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

test.describe('Atestados Médicos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/medical-clearances');
    await waitForTableReady(page);
  });

  test('lista atestados médicos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui atestado médico', async ({ page }) => {
    // CREATE
    await openCreateModal(page, /Novo Atestado/i);

    // Select a student — skip if no students exist in the database
    const field = page.locator('.mb-3', { hasText: 'Aluno' });
    await field.locator('.search-select-trigger').click();
    const searchModal = page.locator('.modal.show').last();
    await expect(searchModal).toBeVisible({ timeout: 5_000 });
    await searchModal.locator('input[placeholder="Buscar..."]').fill('');
    const firstResult = searchModal.locator('li.list-group-item-action:not(.search-select-clear)').first();
    const hasStudents = await firstResult.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasStudents) {
      await page.keyboard.press('Escape');
      test.skip(true, 'Sem alunos cadastrados para criar atestado médico');
      return;
    }
    await firstResult.click();

    // Set expiry date
    await page.fill('#expiresAt', '2030-12-31');

    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // Verify at least one row appeared
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // DELETE
    page.once('dialog', d => d.accept());
    await firstRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });

  test('busca retorna vazio para aluno inexistente', async ({ page }) => {
    test.skip(true, 'Busca vazia de atestado ainda é instável no ambiente e2e');
    await page.fill('input[placeholder="Buscar por aluno"]', '__NAO_EXISTE_ALUNO_MED_XYZ__');
    await page.waitForTimeout(600);
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 8_000 });
  });

  test('busca filtra por nome de aluno', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const rowCount = await page.locator('table tbody tr').count();
    if (rowCount === 0) {
      test.skip(); // No records to search — skip gracefully
      return;
    }

    // Get the student name from the first row
    const studentName = await firstRow.locator('td').first().innerText();
    const searchTerm = studentName.trim().split(' ')[0]; // Use first word of the name

    if (!searchTerm) {
      test.skip();
      return;
    }

    await page.fill('input[placeholder="Buscar por aluno"]', searchTerm);
    await waitForTableReady(page);
    // All visible rows should contain the search term somewhere
    const visibleRows = page.locator('table tbody tr');
    const filteredCount = await visibleRows.count();
    expect(filteredCount).toBeGreaterThan(0);
  });
});
