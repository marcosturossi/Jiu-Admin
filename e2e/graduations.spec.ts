import { test, expect } from './coverage-fixture';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  deleteTestStudent,
  createTestBelt,
  deleteTestBelt,
  acceptConfirmDialog,
} from './helpers';

test.describe('Graduações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/graduations');
    await waitForTableReady(page);
  });

  test('lista graduações', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria, edita e exclui graduação', async ({ page }) => {
    const student = await createTestStudent(page);
    const belt = await createTestBelt(page);

    // CREATE
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#graduationDate', '2029-06-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();
    await expect(row).toContainText(belt.color);

    // EDIT — change the graduation date
    await row.locator('button.btn-outline-info').click();
    await expect(page.locator('.modal.show').first()).toBeVisible();
    await page.fill('#graduationDate', '2029-07-15');
    await page.getByRole('button', { name: /Salvar|Atualizar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);
    await expect(row).toContainText('15/07/2029');

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestBelt(page, belt.color);
    await deleteTestStudent(page, student.firstName);
  });
});
