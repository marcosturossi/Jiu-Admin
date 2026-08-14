import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

/** The platform superadmin persona (no /tenant/* group — see AuthServiceService.isSuperAdmin())
 *  has no tenant of its own, so the regular tenant dashboard doesn't apply to it. Bounce it
 *  straight to Academias, the superadmin's actual landing page, instead. */
export const SuperAdminHomeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthServiceService);
  const router = inject(Router);

  if (authService.isSuperAdmin()) {
    router.navigate(['/system/academies']);
    return false;
  }

  return true;
};
