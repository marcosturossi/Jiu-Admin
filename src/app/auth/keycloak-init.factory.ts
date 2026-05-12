import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

function clearKeycloakStorage(): void {
  for (const storage of [sessionStorage, localStorage]) {
    Object.keys(storage)
      .filter(k => /kc-|keycloak/i.test(k))
      .forEach(k => storage.removeItem(k));
  }
}

export function keycloakInitFactory(): () => Promise<void> {
  const keycloak = inject(Keycloak);
  return async () => {
    try {
      await keycloak.init({
        onLoad:           'login-required',
        checkLoginIframe: false,
        pkceMethod:       'S256',
      });
    } catch {
      clearKeycloakStorage();
      await keycloak.login({ redirectUri: window.location.origin + '/system' });
    }
  };
}
