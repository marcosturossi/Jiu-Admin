import { Browser, Page, expect } from '@playwright/test';

export async function waitForTableReady(page: Page) {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('table')).toBeVisible();
}

/**
 * Logs into Keycloak as the cross-tenant superadmin test account (E2E_SUPERADMIN_USER /
 * E2E_SUPERADMIN_PASSWORD in e2e/.env — a user with no /tenant/* group membership) into a brand
 * new browser context, separate from the suite-wide E2E_USER session in e2e/.auth/state.json.
 *
 * Only /api/admin/* routes (e.g. the Academias page's own admin actions and its
 * payment-settings modal) need this — most pages assume a normal in-tenant admin, and
 * tenant-scoped writes fail outright for a user with no tenant to write to, so never use this as
 * the default session for a whole spec file.
 *
 * Caller owns the returned page/context and must call `context.close()` when done.
 */
export async function loginAsSuperAdmin(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const user = process.env['E2E_SUPERADMIN_USER'];
  const password = process.env['E2E_SUPERADMIN_PASSWORD'];
  if (!user || !password) {
    throw new Error(
      'E2E_SUPERADMIN_USER e E2E_SUPERADMIN_PASSWORD são obrigatórias para testes que exigem a conta superadmin — veja e2e/.env.example.'
    );
  }

  // The chromium project's default `storageState` (e2e/.auth/state.json, the tenant-admin
  // E2E_USER session) would otherwise be inherited here — start from a genuinely blank context so
  // this really re-authenticates as the superadmin instead of silently reusing that session.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto('/system');
  await page.waitForURL(/localhost:8082/, { timeout: 15_000 });
  await page.fill('#username', user);
  await page.fill('#password', password);
  await page.click('[type=submit]');
  await page.waitForURL(/localhost:4200\/system/, { timeout: 15_000 });

  return { page, close: () => context.close() };
}

/**
 * Confirms the shared custom confirm dialog (app-confirm-dialog), which
 * replaced the native browser confirm() for all destructive actions. Call
 * this right after clicking whatever triggered the confirmation.
 */
export async function acceptConfirmDialog(page: Page): Promise<void> {
  const confirmButton = page.getByRole('button', { name: 'Confirmar', exact: true });
  await expect(confirmButton).toBeVisible({ timeout: 5_000 });
  await confirmButton.click();
  await expect(confirmButton).not.toBeVisible({ timeout: 5_000 });
}

/** Interacts with app-search-select: opens it, types a search term, picks the first result. */
export async function selectFromSearchSelect(page: Page, labelText: string, searchText: string) {
  const field = page.locator('.mb-3', { hasText: labelText });
  await field.locator('.search-select-trigger').click();

  // The search-select opens its own modal on top — target the last visible modal
  const searchModal = page.locator('.modal.show').last();
  await expect(searchModal).toBeVisible({ timeout: 5_000 });

  const searchInput = searchModal.locator('input[placeholder="Buscar..."]');
  await searchInput.fill(searchText);

  // Wait for results and click the first non-clear item (use CSS :not to exclude the clear option)
  const firstResult = searchModal.locator('li.list-group-item-action:not(.search-select-clear)').first();
  await expect(firstResult).toBeVisible({ timeout: 8_000 });
  await firstResult.click();
}

export async function openCreateModal(page: Page, buttonText: RegExp | string) {
  await page.getByRole('button', { name: buttonText }).click();
  await expect(page.locator('.modal.show').first()).toBeVisible();
}

export async function saveAndWaitModalClose(page: Page) {
  await page.getByRole('button', { name: /Salvar|Criar/i }).click();
  await expect(page.locator('.modal.show').first()).not.toBeVisible({ timeout: 15_000 });
}

async function waitForGridReady(page: Page) {
  await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
}

function cpfCheckDigit(nums: number[]): number {
  let sum = 0;
  let weight = nums.length + 1;
  for (const n of nums) {
    sum += n * weight;
    weight--;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Generates a fresh, check-digit-valid CPF (digits only) so tests never collide on a shared value. */
export function generateValidCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const d1 = cpfCheckDigit(base);
  const d2 = cpfCheckDigit([...base, d1]);
  return [...base, d1, d2].join('');
}

export interface TestStudent {
  firstName: string;
  lastName: string;
  fullName: string;
  userName: string;
  email: string;
  cpf: string;
}

/** Creates a student with unique data and returns its identifying fields. Leaves the browser on the students list. */
export async function createTestStudent(page: Page, opts?: { lastNameSuffix?: string }): Promise<TestStudent> {
  const ts = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  // The students list's "Buscar por nome do aluno" box only filters by
  // FirstName server-side (confirmed via network capture — it's sent as a
  // FirstName= query param, not a full-name search), so firstName must be
  // unique too, not just lastName, or deleteTestStudent's search below
  // silently matches nothing and no-ops instead of actually cleaning up.
  const firstName = `E2EAux${ts}`;
  const lastName = `Aux${opts?.lastNameSuffix ?? ''}${ts}`;
  const userName = `e2e_aux_${ts}`;
  const email = `e2e_aux_${ts}@teste.com`;
  const cpf = generateValidCpf();

  await page.goto('/system/students');
  await waitForGridReady(page);
  await page.getByRole('button', { name: /Novo Aluno/i }).click();
  await expect(page.locator('.modal.show')).toBeVisible();

  await page.getByLabel('Usuário *').fill(userName);
  await page.getByLabel('E-mail *').fill(email);
  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#cpf').fill(cpf);
  await page.locator('#birthDay').fill('1990-05-15');
  await page.locator('#phoneNumber').fill('11999998888');

  await page.getByRole('button', { name: /Salvar/i }).click();
  await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });

  return { firstName, lastName, fullName: `${firstName} ${lastName}`, userName, email, cpf };
}

/**
 * Deletes a student created by createTestStudent, identified by its unique
 * first name (the search box only filters by FirstName server-side — see
 * the note in createTestStudent). No-op if not found.
 */
export async function deleteTestStudent(page: Page, firstName: string): Promise<void> {
  await page.goto('/system/students');
  await waitForGridReady(page);
  await page.getByPlaceholder('Buscar por nome do aluno').fill(firstName);
  await waitForGridReady(page);

  const card = page.locator('.student-card', { hasText: firstName });
  if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await card.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(card).not.toBeVisible({ timeout: 10_000 });
  }
}

export interface TestBelt {
  color: string;
}

/** Creates a belt with a unique color and returns it. Leaves the browser on the belts list. */
export async function createTestBelt(page: Page): Promise<TestBelt> {
  const color = `E2E-Faixa-${Date.now()}${Math.floor(Math.random() * 1000)}`;

  await page.goto('/system/belts');
  await waitForGridReady(page);
  await page.getByRole('button', { name: /Nova Faixa/i }).click();
  await expect(page.locator('.modal.show')).toBeVisible();

  await page.getByLabel('Cor da Faixa *').fill(color);
  await page.getByLabel('Ordem *').fill('99');

  await page.getByRole('button', { name: /Salvar/i }).click();
  await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });

  return { color };
}

/** Deletes a belt created by createTestBelt, identified by its unique color. No-op if not found. */
export async function deleteTestBelt(page: Page, color: string): Promise<void> {
  await page.goto('/system/belts');
  await waitForTableReady(page);

  const row = page.locator('tr', { hasText: color });
  if (await row.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await row.locator('.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  }
}

export interface TestFeePlan {
  name: string;
}

/** Creates a fee-plan with a unique name and returns it. Leaves the browser on the fee-plans list. */
export async function createTestFeePlan(page: Page): Promise<TestFeePlan> {
  const name = `Plano-E2E-${Date.now()}${Math.floor(Math.random() * 1000)}`;

  await page.goto('/system/fee-plans');
  await waitForTableReady(page);
  await openCreateModal(page, /Novo Plano/i);
  await page.fill('#name', name);
  await page.fill('#monthDuration', '12');
  await page.fill('#price', '150.00');
  await saveAndWaitModalClose(page);
  await waitForTableReady(page);

  return { name };
}

/** Deletes a fee-plan created by createTestFeePlan, identified by its unique name. No-op if not found. */
export async function deleteTestFeePlan(page: Page, name: string): Promise<void> {
  await page.goto('/system/fee-plans');
  await waitForTableReady(page);
  // Search rather than assume the row is on the current page — the list is
  // shared across the whole suite and can span multiple pages.
  await page.fill('input[placeholder="Buscar plano"]', name);
  await page.waitForTimeout(500); // filter debounce
  await waitForTableReady(page);

  const row = page.locator('tr', { hasText: name });
  if (await row.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await row.locator('button.btn-outline-danger').click();
    await acceptConfirmDialog(page);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  }
}

export interface TestSupplier {
  firstName: string;
  lastName: string;
  fullName: string;
}

/** Creates an individual-person supplier with unique data and returns it. Leaves the browser on the suppliers list. */
export async function createTestSupplier(page: Page): Promise<TestSupplier> {
  const ts = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const firstName = 'E2E';
  const lastName = `Fornecedor${ts}`;

  await page.goto('/system/suppliers');
  await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Novo Fornecedor/i }).click();
  await expect(page.locator('.modal.show')).toBeVisible();

  await page.locator('select[formControlName="personType"]').selectOption('individual');
  await page.locator('input[formControlName="firstName"]').fill(firstName);
  await page.locator('input[formControlName="lastName"]').fill(lastName);
  await page.locator('input[formControlName="cpf"]').fill(generateValidCpf());
  await page.locator('input[formControlName="email"]').fill(`e2e_fornecedor_${ts}@teste.com`);

  await page.getByRole('button', { name: /Salvar/i }).click();
  await expect(page.locator('.modal.show')).not.toBeVisible({ timeout: 10_000 });

  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

/** Deletes a supplier created by createTestSupplier, identified by its unique last name. No-op if not found. */
export async function deleteTestSupplier(page: Page, lastName: string): Promise<void> {
  await page.goto('/system/suppliers');
  await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });

  const card = page.locator('.supplier-card', { hasText: lastName });
  if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await card.locator('button[title="Excluir"]').click();
    await acceptConfirmDialog(page);
    await expect(card).not.toBeVisible({ timeout: 10_000 });
  }
}
