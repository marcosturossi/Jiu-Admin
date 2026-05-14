import { Page, expect } from '@playwright/test';

export async function waitForTableReady(page: Page) {
  await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('table')).toBeVisible();
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
