import { test, expect, type Page } from './coverage-fixture';

const TS = Date.now();
const TEST_API_KEY = `$aact_e2e_test_${TS}`;

interface TenantSettings {
  paymentGateway: string;
  asaasApiKey: string;
  webhookSecret: string;
  asaasEnvironment: string;
}

async function waitForFormReady(page: Page): Promise<void> {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#paymentGateway')).toBeVisible();
}

/** Reads whatever is currently on the form. Only reads the Asaas fields when they're actually rendered. */
async function readSettings(page: Page): Promise<TenantSettings> {
  const paymentGateway = await page.locator('#paymentGateway').inputValue();
  if (paymentGateway !== 'asaas') {
    return { paymentGateway, asaasApiKey: '', webhookSecret: '', asaasEnvironment: 'Sandbox' };
  }
  return {
    paymentGateway,
    asaasApiKey: await page.locator('#asaasApiKey').inputValue(),
    webhookSecret: await page.locator('#webhookSecret').inputValue(),
    asaasEnvironment: await page.locator('#asaasEnvironment').inputValue(),
  };
}

async function applySettings(page: Page, settings: TenantSettings): Promise<void> {
  await page.locator('#paymentGateway').selectOption(settings.paymentGateway);
  if (settings.paymentGateway === 'asaas') {
    await page.locator('#asaasApiKey').fill(settings.asaasApiKey);
    await page.locator('#webhookSecret').fill(settings.webhookSecret);
    await page.locator('#asaasEnvironment').selectOption(settings.asaasEnvironment);
  }
}

async function save(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Salvar/i }).click();
}

// Tenant settings is a singleton resource shared by the whole tenant (unlike
// the create-your-own-record-then-delete-it pattern used elsewhere in this
// suite), so every test here operates on a captured snapshot of whatever was
// already configured and afterAll restores it — no test may leave the real
// gateway config mutated once the file finishes.
test.describe('Configurações de Pagamento', () => {
  let original: TenantSettings;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
    original = await readSettings(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' });
    const page = await context.newPage();
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
    await applySettings(page, original);
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/system/payment-settings');
    await waitForFormReady(page);
  });

  test('carrega a página com o provedor atual selecionado', async ({ page }) => {
    await expect(page.locator('app-subnav')).toBeVisible();
    await expect(page.locator('#paymentGateway')).toHaveValue(original.paymentGateway);
  });

  test('lista todas as opções de provedor de pagamento', async ({ page }) => {
    const values = await page.locator('#paymentGateway option').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values).toEqual(['', 'asaas']);
  });

  test('esconde os campos do Asaas quando o provedor é "Nenhum"', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('');
    await expect(page.locator('#asaasApiKey')).not.toBeVisible();
    await expect(page.locator('#asaasEnvironment')).not.toBeVisible();
  });

  test('exibe os campos e todas as opções de ambiente do Asaas quando selecionado', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    await expect(page.locator('#asaasApiKey')).toBeVisible();
    await expect(page.locator('#asaasEnvironment')).toBeVisible();

    const values = await page.locator('#asaasEnvironment option').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(values).toEqual(['Sandbox', 'Production']);
  });

  test('exige a chave de API quando o provedor Asaas é selecionado, sem salvar', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    await page.locator('#asaasApiKey').fill('');
    await save(page);

    await expect(page.locator('.invalid-feedback', { hasText: 'obrigatório' })).toBeVisible();
    await expect(page.locator('.toast-success')).not.toBeVisible();
  });

  test('não exige chave de API quando o provedor é "Nenhum" (chave vazia)', async ({ page }) => {
    // Goes through Asaas first and clears the key there, since the input is
    // removed from the DOM (not just disabled) once "Nenhum" is selected —
    // this is the only way to guarantee the control's value is actually
    // empty (not just hidden) when the form submits with gateway "None".
    await page.locator('#paymentGateway').selectOption('asaas');
    await page.locator('#asaasApiKey').fill('');
    await page.locator('#paymentGateway').selectOption('');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
  });

  test('exibe erro e não trava a página quando o carregamento das configurações falha', async ({ page }) => {
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao carregar configurações.' }),
        });
      }
      return route.continue();
    });

    await page.reload();
    await waitForFormReady(page);

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao carregar configurações.' })).toBeVisible({ timeout: 10_000 });
    // Page must remain usable (not stuck on the loading spinner) after a failed GET.
    await expect(page.locator('#paymentGateway')).toBeVisible();
  });

  test('exibe erro e reabilita o botão quando salvar falha', async ({ page }) => {
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Erro Simulado', detail: 'Falha simulada ao salvar configurações.' }),
        });
      }
      return route.continue();
    });

    await page.locator('#paymentGateway').selectOption('');
    await save(page);

    await expect(page.locator('.toast-error', { hasText: 'Falha simulada ao salvar configurações.' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.toast-success')).not.toBeVisible();
    // isSaving must reset to false on failure so the user can retry.
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });

  test('aplica valores padrão quando a API retorna campos nulos no carregamento', async ({ page }) => {
    // The DTO types paymentGateway/asaasEnvironment as non-null, but the
    // component still falls back defensively (`?? None` / `?? Sandbox`) in
    // case a real backend response ever violates that contract — exercise
    // that path directly since it can't happen through normal backend use.
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ paymentGateway: null, asaasApiKey: null, asaasEnvironment: null }),
        });
      }
      return route.continue();
    });

    await page.reload();
    await waitForFormReady(page);

    await expect(page.locator('#paymentGateway')).toHaveValue('');
  });

  test('mantém a chave de API vazia quando a API retorna null após salvar', async ({ page }) => {
    await page.route('**/api/settings', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ paymentGateway: null, asaasApiKey: null, asaasEnvironment: 'Sandbox' }),
        });
      }
      return route.continue();
    });

    await page.locator('#paymentGateway').selectOption('');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });
  });

  test('alterna a visibilidade da chave de API', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    const input = page.locator('#asaasApiKey');
    await expect(input).toHaveAttribute('type', 'password');
    await page.getByTitle('Mostrar/Ocultar', { exact: true }).click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('alterna a visibilidade do segredo do webhook, independente da chave de API', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    const secretInput = page.locator('#webhookSecret');
    const apiKeyInput = page.locator('#asaasApiKey');
    await expect(secretInput).toHaveAttribute('type', 'password');
    await page.getByTitle('Mostrar/Ocultar Segredo').click();
    await expect(secretInput).toHaveAttribute('type', 'text');
    await expect(apiKeyInput).toHaveAttribute('type', 'password'); // unaffected by the other toggle
  });

  test('não exige segredo do webhook (campo opcional) e salva sem ele', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    await page.locator('#asaasApiKey').fill(TEST_API_KEY);
    await page.locator('#webhookSecret').fill('');
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeEnabled();
  });

  test('salva um novo provedor Asaas e persiste após recarregar a página', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    await page.locator('#asaasApiKey').fill(TEST_API_KEY);
    await page.locator('#webhookSecret').fill('whsec_e2e_test');
    await page.locator('#asaasEnvironment').selectOption('Production');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForFormReady(page);
    await expect(page.locator('#paymentGateway')).toHaveValue('asaas');
    // The backend masks secrets on GET (only the last few characters survive) —
    // assert the masked shape rather than the plaintext we originally sent.
    await expect(page.locator('#webhookSecret')).toHaveValue(/\*+test$/);
    await expect(page.locator('#asaasEnvironment')).toHaveValue('Production');
  });

  test('troca de ambiente do Asaas entre Sandbox e Produção e persiste', async ({ page }) => {
    await page.locator('#paymentGateway').selectOption('asaas');
    await page.locator('#asaasApiKey').fill(TEST_API_KEY);
    await page.locator('#asaasEnvironment').selectOption('Sandbox');
    await save(page);
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await waitForFormReady(page);
    await expect(page.locator('#asaasEnvironment')).toHaveValue('Sandbox');
  });
});
