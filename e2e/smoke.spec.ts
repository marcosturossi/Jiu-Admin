import { test, expect } from '@playwright/test';

const sections = [
  { path: '/system/home',                    label: 'Home' },
  { path: '/system/student-onboarding',      label: 'Onboarding de Alunos' },
  { path: '/system/students',                label: 'Estudantes' },
  { path: '/system/lessons',                 label: 'Aulas' },
  { path: '/system/graduations',             label: 'Graduações' },
  { path: '/system/frequencies',             label: 'Frequências' },
  { path: '/system/belts',                   label: 'Faixas' },
  { path: '/system/graduation-requirements', label: 'Requisitos de Graduação' },
  { path: '/system/notices',                 label: 'Avisos' },
  { path: '/system/notification',            label: 'Notificações' },
  { path: '/system/finance-dashboard',       label: 'Dashboard Financeiro' },
  { path: '/system/fee-plans',               label: 'Planos de Mensalidade' },
  { path: '/system/contracts',               label: 'Contratos' },
  { path: '/system/transactions',            label: 'Transações' },
  { path: '/system/transaction-categories',  label: 'Categorias de Transação' },
  { path: '/system/medical-clearances',      label: 'Atestados Médicos' },
  { path: '/system/face-recognition',        label: 'Reconhecimento Facial' },
  { path: '/system/academies',               label: 'Academias' },
];

test.describe('Smoke: navegação entre seções', () => {
  for (const section of sections) {
    test(`carrega: ${section.label}`, async ({ page }) => {
      await page.goto(section.path);

      // Must not redirect to 404
      await expect(page).not.toHaveURL(/\/404/);

      // App shell must be present (proves Angular loaded and Keycloak auth succeeded)
      await expect(page.locator('app-subnav')).toBeVisible({ timeout: 10_000 });

      // No top-level error alert blocking the page
      const errorAlert = page.locator('.alert-danger');
      await expect(errorAlert).not.toBeVisible();
    });
  }
});
