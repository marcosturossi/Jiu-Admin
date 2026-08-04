import { test, expect, type Page } from './coverage-fixture';

const TS = Date.now();

interface AcademyProfile {
  name: string;
  cnpj: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

async function waitForFormReady(page: Page): Promise<void> {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#name')).toBeVisible();
}

async function readProfile(page: Page): Promise<AcademyProfile> {
  return {
    name: await page.locator('#name').inputValue(),
    cnpj: await page.locator('#cnpj').inputValue(),
    email: await page.locator('#email').inputValue(),
    street: await page.locator('#street').inputValue(),
    number: await page.locator('#number').inputValue(),
    neighborhood: await page.locator('#neighborhood').inputValue(),
    city: await page.locator('#city').inputValue(),
    state: await page.locator('#state').inputValue(),
  };
}

async function applyProfile(page: Page, profile: AcademyProfile): Promise<void> {
  await page.locator('#name').fill(profile.name);
  await page.locator('#cnpj').fill(profile.cnpj);
  await page.locator('#email').fill(profile.email);
  await page.locator('#street').fill(profile.street);
  await page.locator('#number').fill(profile.number);
  await page.locator('#neighborhood').fill(profile.neighborhood);
  await page.locator('#city').fill(profile.city);
  await page.locator('#state').fill(profile.state);
}

async function save(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Salvar/i }).click();
}

// The academy is a singleton resource (one row per tenant) — every test here
// operates on a captured snapshot of whatever was already saved and afterAll
// restores it, mirroring payment-settings.spec.ts.
test.describe('Dados da Academia', () => {
  let original: AcademyProfile;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/academy-profile');
    await waitForFormReady(page);
    original = await readProfile(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/academy-profile');
    await waitForFormReady(page);
    await applyProfile(page, original);
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/academy-profile');
    await waitForFormReady(page);
  });

  test('carrega a página com os dados atuais da academia', async ({ page }) => {
    await expect(page.locator('app-subnav')).toBeVisible();
    await expect(page.locator('#name')).toHaveValue(original.name);
  });

  test('exige o nome da academia, sem salvar', async ({ page }) => {
    await page.locator('#name').fill('');
    await save(page);

    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page.locator('.toast-success')).not.toBeVisible();
  });

  test('salva CNPJ, e-mail e endereço e persiste após recarregar', async ({ page }) => {
    const updated: AcademyProfile = {
      name: `Academia E2E ${TS}`,
      cnpj: '12.345.678/0001-90',
      email: `contato-${TS}@academia-e2e.com`,
      street: `Rua dos Testes ${TS}`,
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };

    await applyProfile(page, updated);
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForFormReady(page);
    await expect(page.locator('#name')).toHaveValue(updated.name);
    await expect(page.locator('#cnpj')).toHaveValue(updated.cnpj);
    await expect(page.locator('#email')).toHaveValue(updated.email);
    await expect(page.locator('#street')).toHaveValue(updated.street);
    await expect(page.locator('#city')).toHaveValue(updated.city);
    await expect(page.locator('#state')).toHaveValue(updated.state);
  });

  test('exibe erro e reabilita o botão quando salvar falha', async ({ page }) => {
    await page.route('**/api/academy/me', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao salvar dados da academia.' }),
        });
      }
      return route.continue();
    });

    await save(page);

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao salvar dados da academia.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });
});
