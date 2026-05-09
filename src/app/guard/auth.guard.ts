import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';
import Keycloak from 'keycloak-js';

const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
  { authenticated }: AuthGuardData,
): Promise<boolean> => {
  if (!authenticated) {
    await inject(Keycloak).login({ redirectUri: window.location.origin + '/system' });
    return false;
  }
  return true;
};

export const AuthGuard = createAuthGuard(isAccessAllowed);

