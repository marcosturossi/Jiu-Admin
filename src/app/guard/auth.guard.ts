import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthServiceService } from '../services/auth-service.service';

const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
  { authenticated }: AuthGuardData,
): Promise<boolean> => {
  if (!authenticated) {
    await inject(Keycloak).login({ redirectUri: window.location.origin + '/system' });
    return false;
  }

  if (!inject(AuthServiceService).hasAnyRole(['manager', 'admin'])) {
    inject(Router).navigate(['/forbidden']);
    return false;
  }

  return true;
};

export const AuthGuard = createAuthGuard(isAccessAllowed);

