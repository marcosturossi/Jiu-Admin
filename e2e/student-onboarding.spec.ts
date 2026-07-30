import { test, expect } from './coverage-fixture';
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

  test('cria faixa e plano pelos botões "+" durante o assistente, sem sair da página', async ({ page }) => {
    const beltColor = `E2E-Faixa-Onboard-${Date.now()}`;
    const planName = `Plano-E2E-Onboard-${Date.now()}`;
    const ts = Date.now();
    const firstName = `E2EOnboardQC${ts}`;
    const name = `${firstName} SobrenomeQC${ts}`;
    const email = `e2e_onboard_qc_${ts}@teste.com`;

    await page.goto('/system/student-onboarding');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });

    // STEP 1
    await page.fill('#name', name);
    await page.fill('#email', email);
    await page.fill('#phone', '11999998888');
    await page.fill('#cpf', generateValidCpf());
    await page.fill('#dateOfBirth', '1995-04-20');
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 2 de 4')).toBeVisible();

    // STEP 2 — quick-create belt inline
    await page.locator('button[title="Nova faixa"]').click();
    const beltModal = page.locator('.modal.show').last();
    await expect(beltModal).toBeVisible();
    await beltModal.locator('#color').fill(beltColor);
    await beltModal.locator('#orderIndex').fill('99');
    await beltModal.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).toHaveCount(0, { timeout: 10_000 });
    const beltSelectedLabel = await page.locator('#beltId option:checked').textContent();
    expect(beltSelectedLabel?.trim()).toBe(beltColor);

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();

    // STEP 3 — quick-create fee plan inline
    await page.locator('button[title="Novo plano"]').click();
    const planModal = page.locator('.modal.show').last();
    await expect(planModal).toBeVisible();
    await planModal.locator('#name').fill(planName);
    await planModal.locator('#monthDuration').fill('6');
    await planModal.locator('#price').fill('80.00');
    await planModal.getByRole('button', { name: /Salvar/i }).click();
    await expect(page.locator('.modal.show')).toHaveCount(0, { timeout: 10_000 });
    const planSelectedLabel = await page.locator('#feePlanId option:checked').textContent();
    expect(planSelectedLabel).toContain(planName);

    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 4 de 4')).toBeVisible();

    // STEP 4 — confirmation summary reflects the freshly-created belt/plan
    await expect(page.getByText(beltColor)).toBeVisible();
    await expect(page.getByText(planName)).toBeVisible();

    const finishButton = page.getByRole('button', { name: /Finalizar Cadastro/i });
    await page.getByText('Confirmo que os dados estão corretos').click();
    await finishButton.click();

    // Scoped by text — the belt/plan quick-create toasts from earlier steps
    // ("Faixa Criada!", "Plano Criado!") can still be on screen at this point.
    await expect(page.locator('.toast-success .toast-title', { hasText: 'Aluno Cadastrado' })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/system\/students\/details\//, { timeout: 10_000 });

    // CLEANUP
    await deleteTestStudent(page, firstName);
    await deleteTestFeePlan(page, planName);
    await deleteTestBelt(page, beltColor);
  });

  test('exibe erro e permite tentar novamente quando falha o cadastro final', async ({ page }) => {
    await page.route('**/api/Students', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao cadastrar aluno.' }) });
      }
      return route.continue();
    });

    await page.goto('/system/student-onboarding');
    await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });

    const errTs = Date.now();
    await page.fill('#name', `E2EErro ${errTs}`);
    await page.fill('#email', `e2e_onboard_err_${errTs}@teste.com`);
    await page.fill('#phone', '11999998888');
    await page.fill('#cpf', generateValidCpf());
    await page.fill('#dateOfBirth', '1995-04-20');
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 2 de 4')).toBeVisible();

    // Any existing belt/plan works here — this test only cares that the final POST fails cleanly.
    await page.locator('#beltId').selectOption({ index: 1 });
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();

    await page.locator('#feePlanId').selectOption({ index: 1 });
    await page.getByRole('button', { name: /Próximo/i }).click();
    await expect(page.getByText('Passo 4 de 4')).toBeVisible();

    await page.getByText('Confirmo que os dados estão corretos').click();
    const finishButton = page.getByRole('button', { name: /Finalizar Cadastro/i });
    await finishButton.click();

    await expect(page.locator('.alert-danger', { hasText: 'Falha simulada ao cadastrar aluno.' })).toBeVisible({ timeout: 10_000 });
    // Still on the wizard (no navigation to a student detail page), and able to retry.
    await expect(page).toHaveURL(/\/system\/student-onboarding$/);
    await expect(finishButton).toBeEnabled();
  });
});
