import { test, expect } from '@playwright/test';
import {
  waitForTableReady,
  openCreateModal,
  saveAndWaitModalClose,
  selectFromSearchSelect,
  createTestStudent,
  deleteTestStudent,
  createTestBelt,
  deleteTestBelt,
} from './helpers';

const TS = Date.now();
const LESSON_TITLE = `Aula-E2E-Freq-${TS}`;

test.describe('Frequências', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/frequencies');
    await waitForTableReady(page);
  });

  test('lista frequências', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
  });

  test('cria e exclui frequência', async ({ page }) => {
    test.setTimeout(90_000);

    const student = await createTestStudent(page);
    const belt = await createTestBelt(page);

    // SETUP — assign the graduation to OUR student specifically (the previous
    // version of this test used a blank search here, which silently picked
    // whichever student happened to be first — not necessarily the one just
    // created — so the frequency step below could never find a graduated
    // match. That was the actual cause of the instability, not selector flake.)
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#graduationDate', '2025-01-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    // SETUP — a lesson (frequency requires a lesson reference)
    await page.goto('/system/lessons');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', LESSON_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    // CREATE frequency — select lesson then only our graduated student
    await page.goto('/system/frequencies');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Frequência/i);
    await selectFromSearchSelect(page, 'Aula', LESSON_TITLE);

    await expect(page.locator('.student-item').first()).toBeVisible({ timeout: 10_000 });

    const studentItem = page.locator('.student-item').filter({ hasText: student.lastName });
    await studentItem.locator('.student-checkbox').check();
    await expect(page.locator('.count-badge')).not.toHaveText('0 selecionados');

    await page.getByRole('button', { name: /Criar \d+ frequências?/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const freqRow = page.locator('table tbody tr', { hasText: student.lastName });
    await expect(freqRow).toBeVisible();

    // DELETE frequency
    page.once('dialog', d => d.accept());
    await freqRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
    await expect(freqRow).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP — lesson
    await page.goto('/system/lessons');
    await waitForTableReady(page);
    const lessonRow = page.locator('tr', { hasText: LESSON_TITLE });
    page.once('dialog', d => d.accept());
    await lessonRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);

    // CLEANUP — graduation
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    const gradRow = page.locator('tr', { hasText: student.lastName });
    page.once('dialog', d => d.accept());
    await gradRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);

    // CLEANUP — belt, student
    await deleteTestBelt(page, belt.color);
    await deleteTestStudent(page, student.firstName);
  });
});
