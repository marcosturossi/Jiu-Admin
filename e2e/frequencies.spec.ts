import { test, expect } from '@playwright/test';
import { waitForTableReady, openCreateModal, selectFromSearchSelect } from './helpers';

const TS = Date.now();
const STUDENT_USER = `freq-e2e-${TS}`;
const STUDENT_FIRST = 'FreqE2E';
const STUDENT_LAST = `S${TS}`;
const STUDENT_NAME = `${STUDENT_FIRST} ${STUDENT_LAST}`;
const STUDENT_EMAIL = `freq-e2e-${TS}@test.com`;
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
    // SETUP 1 — Create a student (backend requires graduation for frequency creation)
    await page.goto('/system/students');
    await waitForTableReady(page);
    await openCreateModal(page, /Novo Aluno/i);
    await page.fill('#userName', STUDENT_USER);
    await page.fill('#email', STUDENT_EMAIL);
    await page.fill('#firstName', STUDENT_FIRST);
    await page.fill('#lastName', STUDENT_LAST);
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // SETUP 2 — Assign a graduation to that student (required by backend rule)
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', STUDENT_NAME);
    await page.selectOption('#beltId', { index: 1 });
    await page.fill('#graduationDate', '2025-01-01');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // SETUP 3 — Create a lesson (frequency requires a lesson reference)
    await page.goto('/system/lessons');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', LESSON_TITLE);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await page.getByRole('button', { name: /Salvar|Criar/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
    await waitForTableReady(page);

    // CREATE frequency — select lesson then only our graduated student
    await page.goto('/system/frequencies');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Frequência/i);
    await selectFromSearchSelect(page, 'Aula', LESSON_TITLE);

    await expect(page.locator('.student-item').first()).toBeVisible({ timeout: 10_000 });

    // Check only our student's checkbox (they're the only graduated one)
    const studentItem = page.locator('.student-item').filter({ hasText: STUDENT_LAST });
    await studentItem.locator('.student-checkbox').check();
    await expect(page.locator('.count-badge')).not.toHaveText('0 selecionados');

    await page.getByRole('button', { name: /Criar \d+ frequências?/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    // DELETE frequency
    const freqRow = page.locator('table tbody tr').first();
    page.once('dialog', d => d.accept());
    await freqRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);

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
    const gradRow = page.locator('tr', { hasText: STUDENT_LAST });
    page.once('dialog', d => d.accept());
    await gradRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);

    // CLEANUP — student
    await page.goto('/system/students');
    await waitForTableReady(page);
    await page.getByPlaceholder('Buscar aluno').fill('');
    await page.getByPlaceholder('Buscar aluno').fill(STUDENT_LAST);
    await waitForTableReady(page);
    const studentRow = page.locator('tr', { hasText: STUDENT_LAST });
    page.once('dialog', d => d.accept());
    await studentRow.locator('button.btn-outline-danger').click();
    await waitForTableReady(page);
  });
});
