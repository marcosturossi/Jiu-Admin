import { provideKeycloak, withAutoRefreshToken, AutoRefreshTokenService, UserActivityService } from 'keycloak-angular';
import { environment } from '../enviroments/environment';
import { getStoredAcademy } from '../services/academy-session.service';

const storedAcademy = getStoredAcademy();

export const keycloakProviders = provideKeycloak({
  config: {
    url:      storedAcademy?.keycloakUrl ?? environment.keycloak.url,
    realm:    storedAcademy?.realm       ?? environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  },
  initOptions: {
    onLoad:           storedAcademy ? 'login-required' : 'check-sso',
    checkLoginIframe: false,
    pkceMethod:       'S256',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  },
  features: [
    withAutoRefreshToken({
      onInactivityTimeout: 'logout',
      sessionTimeout:      300_000, // 5 min
    }),
  ],
  providers: [AutoRefreshTokenService, UserActivityService],
});
