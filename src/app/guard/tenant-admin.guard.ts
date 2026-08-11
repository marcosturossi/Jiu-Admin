import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

/** Blocks non-admins from admin-only pages (e.g. payment settings) — the counterpart to the
 *  backend's "TenantAdmin" authorization policy. Redirects to the dashboard rather than showing
 *  a broken/empty page, since there's no dedicated "forbidden" route in this app. */
export const TenantAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthServiceService);
  const router = inject(Router);

  if (authService.isTenantAdmin()) {
    return true;
  }

  router.navigate(['/system/home']);
  return false;
};
