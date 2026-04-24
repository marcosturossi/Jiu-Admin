import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AcademySessionService, getStoredAcademy } from '../services/academy-session.service';

const KC_LOGIN_FLAG = 'kc_login_in_progress';
export const KC_AUTH_ERROR = 'kc_auth_error';

const isAccessAllowed = async (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
  { authenticated }: AuthGuardData,
): Promise<boolean | UrlTree> => {
  const loginAttempted = sessionStorage.getItem(KC_LOGIN_FLAG);
  sessionStorage.removeItem(KC_LOGIN_FLAG);

  if (!authenticated) {
    if (!getStoredAcademy()) {
      return inject(Router).createUrlTree(['/select-academy']);
    }
    // Came back from Keycloak but exchange failed → clear academy, break loop, show error
    if (loginAttempted) {
      inject(AcademySessionService).clearAcademy();
      sessionStorage.setItem(KC_AUTH_ERROR, 'auth_failed');
      return inject(Router).createUrlTree(['/select-academy']);
    }
    try {
      sessionStorage.setItem(KC_LOGIN_FLAG, '1');
      await inject(Keycloak).login({ redirectUri: window.location.origin + '/system' });
    } catch {
      sessionStorage.removeItem(KC_LOGIN_FLAG);
      return inject(Router).createUrlTree(['/select-academy']);
    }
    return false;
  }

  return true;
};

export const AuthGuard = createAuthGuard(isAccessAllowed);

