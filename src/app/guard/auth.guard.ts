import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';

const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
  { authenticated, grantedRoles }: AuthGuardData,
): Promise<boolean | UrlTree> => {
  if (!authenticated) {
    return inject(Router).createUrlTree(['/select-academy']);
  }
  const realm = grantedRoles.realmRoles;
  return realm.includes('manage-realm') && realm.includes('manage-users');
};

export const AuthGuard = createAuthGuard(isAccessAllowed);

