import { test, expect } from '@playwright/test';
import {
  waitForTableReady,
  openCreateModal,
  selectFromSearchSelect,
  createTestStudent,
  deleteTestStudent,
} from './helpers';

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
    const student = await createTestStudent(page);

    // CREATE
    await page.goto('/system/medical-clearances');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Atestado/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.fill('#expiresAt', '2030-12-31');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();

    // NOTE: no search test here — the "Buscar por aluno" box only emits free
    // text, but apiMedicalClearanceGet only accepts filtering by studentId
    // (confirmed via the generated client), so the search box can't actually
    // filter this list. Not an e2e flakiness issue; the feature isn't wired
    // to the backend at all.

    // DELETE
    page.once('dialog', d => d.accept());
    await row.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestStudent(page, student.firstName);
  });
});
