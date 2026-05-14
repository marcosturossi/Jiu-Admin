import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/state.json');

setup('autenticar no Keycloak', async ({ page }) => {
  const user = process.env['E2E_USER'];
  const password = process.env['E2E_PASSWORD'];

  if (!user || !password) {
    throw new Error(
      'As variáveis de ambiente E2E_USER e E2E_PASSWORD são obrigatórias para os testes e2e.'
    );
  }

  await page.goto('/system');

  // Wait for Keycloak redirect
  await page.waitForURL(/localhost:8082/, { timeout: 15_000 });

  await page.fill('#username', user);
  await page.fill('#password', password);
  await page.click('[type=submit]');

  // Wait to be redirected back to the app
  await page.waitForURL(/localhost:4200\/system/, { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
