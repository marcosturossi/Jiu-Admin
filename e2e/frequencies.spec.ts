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

    // The roster now regularly exceeds the default page of 100, so search
    // rather than assume the freshly-created student is already loaded.
    await page.getByPlaceholder('Buscar aluno por nome...').fill(student.lastName);
    const studentItem = page.locator('.student-item').filter({ hasText: student.lastName });
    await expect(studentItem).toBeVisible({ timeout: 8_000 });
    await studentItem.locator('.student-checkbox').check();
    await expect(page.locator('.count-badge')).not.toHaveText('0 selecionados');

    await page.getByRole('button', { name: /Criar \d+ frequências?/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const freqRow = page.locator('table tbody tr', { hasText: student.lastName });
    await expect(freqRow).toBeVisible();

    // DELETE frequency
    await freqRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);
    await expect(freqRow).not.toBeVisible({ timeout: 10_000 });

    // CLEANUP — lesson
    await page.goto('/system/lessons');
    await waitForTableReady(page);
    const lessonRow = page.locator('tr', { hasText: LESSON_TITLE });
    await lessonRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    // CLEANUP — graduation
    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);
    const gradRow = page.locator('tr', { hasText: student.lastName });
    await gradRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    // CLEANUP — belt, student
    await deleteTestBelt(page, belt.color);
    await deleteTestStudent(page, student.firstName);
  });

  test('busca de alunos filtra a lista e permite selecionar todos os filtrados', async ({ page }) => {
    const student = await createTestStudent(page);

    await page.goto('/system/frequencies');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Frequência/i);
    await expect(page.locator('.student-item').first()).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder('Buscar aluno por nome...').fill(student.lastName);
    const studentItem = page.locator('.student-item').filter({ hasText: student.lastName });
    await expect(studentItem).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.student-item')).toHaveCount(1); // search narrowed the list to just this student

    await page.getByRole('button', { name: /Selecionar Todos/i }).click();
    await expect(studentItem.locator('.student-checkbox')).toBeChecked();
    await expect(page.locator('.count-badge')).toHaveText('1 selecionados');

    // Selection survives clearing the search — it's tracked by student id, not list position.
    await page.getByPlaceholder('Buscar aluno por nome...').fill('');
    await expect(page.locator('.student-item').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.count-badge')).toHaveText('1 selecionados');

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await deleteTestStudent(page, student.firstName);
  });

  test('exige aula e ao menos um aluno antes de habilitar criar', async ({ page }) => {
    await openCreateModal(page, /Nova Frequência/i);
    const createButton = page.getByRole('button', { name: /Criar 0 frequências/i });
    await expect(createButton).toBeDisabled();
  });

  test('exibe erro quando falha ao carregar a lista', async ({ page }) => {
    await page.route('**/api/Frequency**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado' }) });
      }
      return route.continue();
    });
    await page.reload();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro quando falha ao excluir', async ({ page }) => {
    const student = await createTestStudent(page);
    const belt = await createTestBelt(page);
    const lessonTitle = `Aula-E2E-FreqErr-${Date.now()}`;

    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Graduação/i);
    await selectFromSearchSelect(page, 'Aluno', student.lastName);
    await page.selectOption('#beltId', { label: belt.color });
    await page.fill('#graduationDate', '2025-01-01');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    await page.goto('/system/lessons');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Aula/i);
    await page.locator('#generate-title').uncheck();
    await page.fill('#title', lessonTitle);
    await page.fill('#scheduledDate', '2030-12-01T10:00');
    await page.fill('#duration', '01:30');
    await saveAndWaitModalClose(page);
    await waitForTableReady(page);

    await page.goto('/system/frequencies');
    await waitForTableReady(page);
    await openCreateModal(page, /Nova Frequência/i);
    await selectFromSearchSelect(page, 'Aula', lessonTitle);
    await page.getByPlaceholder('Buscar aluno por nome...').fill(student.lastName);
    const studentItem = page.locator('.student-item').filter({ hasText: student.lastName });
    await expect(studentItem).toBeVisible({ timeout: 8_000 });
    await studentItem.locator('.student-checkbox').check();
    await page.getByRole('button', { name: /Criar \d+ frequências?/i }).click();
    await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 20_000 });
    await waitForTableReady(page);

    const freqRow = page.locator('table tbody tr', { hasText: student.lastName });
    await expect(freqRow).toBeVisible();

    await page.route('**/api/Frequency/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao excluir frequência.' }) });
      }
      return route.continue();
    });
    await freqRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao excluir frequência.' })).toBeVisible({ timeout: 10_000 });
    await expect(freqRow).toBeVisible();

    await page.unroute('**/api/Frequency/*');
    await freqRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    // CLEANUP
    await page.goto('/system/lessons');
    await waitForTableReady(page);
    const lessonRow = page.locator('tr', { hasText: lessonTitle });
    await lessonRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    await page.goto('/system/graduations');
    await waitForTableReady(page);
    await page.selectOption('select', '100').catch(() => {});
    await waitForTableReady(page);
    const gradRow = page.locator('tr', { hasText: student.lastName });
    await gradRow.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await waitForTableReady(page);

    await deleteTestBelt(page, belt.color);
    await deleteTestStudent(page, student.firstName);
  });
});
