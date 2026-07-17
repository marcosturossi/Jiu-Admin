import { test, expect } from '@playwright/test';
import { generateValidCpf, deleteTestStudent, createTestBelt, deleteTestBelt, createTestFeePlan, deleteTestFeePlan } from './helpers';

const TS = Date.now();
// The students search box only filters by FirstName server-side, so the
// first name must be unique too (not just "E2E") for cleanup to find it.
const FIRST_NAME = `E2EOnboard${TS}`;
const LAST_NAME = `Onboard${TS}`;
const NAME = `${FIRST_NAME} ${LAST_NAME}`;
const EMAIL = `e2e_onboard_${TS}@teste.com`;

test.describe('Cadastro de Alunos (Onboarding)', () => {
  test('completa o assistente de 4 passos e cadastra o aluno com faixa e contrato reais', async ({ page }) => {
    const belt = await createTestBelt(page);
    const feePlan = await createTestFeePlan(page);

    await page.goto('/system/student-onboarding');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });

    // STEP 1 — basic info
    await expect(page.getByText('Passo 1 de 4')).toBeVisible();
    await page.fill('#name', NAME);
    await page.fill('#email', EMAIL);
    await page.fill('#phone', '11999998888');
    await page.fill('#cpf', generateValidCpf());
    await page.fill('#dateOfBirth', '1995-04-20');

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 2 de 4')).toBeVisible();

    // STEP 2 — real belt, backed by BeltService
    await page.locator('#beltId').selectOption({ label: belt.color });

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();

    // STEP 3 — real fee plan, backed by FeePlanService
    const planOptionValue = await page.locator('#feePlanId option', { hasText: feePlan.name }).getAttribute('value');
    await page.locator('#feePlanId').selectOption(planOptionValue!);

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 4 de 4')).toBeVisible();

    // STEP 4 — confirmation summary should reflect the real belt/plan names
    await expect(page.getByText(belt.color)).toBeVisible();
    await expect(page.getByText(feePlan.name)).toBeVisible();

    // Finalizar is disabled until terms are accepted
    const finishButton = page.getByRole('button', { name: /Finalizar Cadastro/i });
    await expect(finishButton).toBeDisabled();
    await page.getByText('Confirmo que os dados estão corretos').click();
    await expect(finishButton).toBeEnabled();

    await finishButton.click();

    // Success toast, then navigation to the new student's detail page
    await expect(page.locator('.toast-success .toast-title')).toContainText('Aluno Cadastrado', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/system\/students\/details\//, { timeout: 10_000 });

    // The belt/graduation and contract created by the wizard show up on the student's own detail page
    await expect(page.getByText(belt.color).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(feePlan.name).first()).toBeVisible();

    // CLEANUP
    await deleteTestStudent(page, FIRST_NAME);
    await deleteTestFeePlan(page, feePlan.name);
    await deleteTestBelt(page, belt.color);
  });
});
