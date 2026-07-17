import { test, expect } from '@playwright/test';
import { generateValidCpf, deleteTestStudent } from './helpers';

const TS = Date.now();
// The students search box only filters by FirstName server-side, so the
// first name must be unique too (not just "E2E") for cleanup to find it.
const FIRST_NAME = `E2EOnboard${TS}`;
const LAST_NAME = `Onboard${TS}`;
const NAME = `${FIRST_NAME} ${LAST_NAME}`;
const EMAIL = `e2e_onboard_${TS}@teste.com`;

test.describe('Cadastro de Alunos (Onboarding)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system/student-onboarding');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
  });

  test('completa o assistente de 4 passos e cadastra o aluno', async ({ page }) => {
    // STEP 1 — basic info
    await expect(page.getByText('Passo 1 de 4')).toBeVisible();
    await page.fill('#name', NAME);
    await page.fill('#email', EMAIL);
    await page.fill('#phone', '11999998888');
    await page.fill('#cpf', generateValidCpf());
    await page.fill('#dateOfBirth', '1995-04-20');

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 2 de 4')).toBeVisible();

    // STEP 2 — belt (not persisted by the backend today, just click through)
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();

    // STEP 3 — contract (not persisted by the backend today, just click through)
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 4 de 4')).toBeVisible();

    // STEP 4 — finish
    await page.getByRole('button', { name: /Finalizar Cadastro/i }).click();
    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.alert-success')).toContainText('cadastrado com sucesso');

    // Wizard auto-resets to step 1 after success
    await expect(page.getByText('Passo 1 de 4')).toBeVisible({ timeout: 5_000 });

    // CLEANUP
    await deleteTestStudent(page, FIRST_NAME);
  });
});
