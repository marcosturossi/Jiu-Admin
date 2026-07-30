import { test, expect } from './coverage-fixture';
import { waitForTableReady, openCreateModal, selectFromSearchSelect, createTestStudent, deleteTestStudent, acceptConfirmDialog } from './helpers';
import path from 'path';

const FIXTURE_IMAGE = path.join(__dirname, 'fixtures', 'test-image.jpeg');

test.describe('Reconhecimento Facial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
  });

  test('lista pessoas cadastradas', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui pessoa no reconhecimento facial', async ({ page }) => {
    const student = await createTestStudent(page);

    // CREATE
    await page.goto('/system/face-recognition');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Pessoa/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.locator('#imagesInput').setInputFiles(FIXTURE_IMAGE);
    await page.getByRole('button', { name: /Criar Pessoa/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const row = page.locator('tr', { hasText: student.lastName });
    await expect(row).toBeVisible();

    // DELETE
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP
    await deleteTestStudent(page, student.firstName);
  });
});
