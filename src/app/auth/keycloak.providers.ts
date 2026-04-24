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
  initOptions: storedAcademy ? {
    onLoad:           'login-required',
    checkLoginIframe: false,
    pkceMethod:       'S256',
  } : undefined,
  features: [
    withAutoRefreshToken({
      onInactivityTimeout: 'logout',
      sessionTimeout:      300_000, // 5 min
    }),
  ],
  providers: [AutoRefreshTokenService, UserActivityService],
});
