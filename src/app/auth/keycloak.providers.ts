import { provideKeycloak, withAutoRefreshToken, AutoRefreshTokenService, UserActivityService } from 'keycloak-angular';
import { environment } from '../enviroments/environment';

export const keycloakProviders = provideKeycloak({
  config: {
    url:      environment.keycloak.url,
    realm:    environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  },
  initOptions: {
    onLoad:           'login-required',
    checkLoginIframe: false,
    pkceMethod:       'S256',
  },
  features: [
    withAutoRefreshToken({
      onInactivityTimeout: 'logout',
      sessionTimeout:      300_000, // 5 min
    }),
  ],
  providers: [AutoRefreshTokenService, UserActivityService],
});
