import { test, expect } from '@playwright/test';
import { waitForTableReady } from './helpers';

test.describe('Mensalidades', () => {
  test('lista mensalidades (somente leitura)', async ({ page }) => {
    await page.goto('/system/monthly-fees');
    await waitForTableReady(page);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('app-subnav')).toBeVisible();
    // No create button — this is a read-only list
    await expect(page.getByRole('button', { name: /Nova Mensalidade/i })).not.toBeVisible();
  });
});
