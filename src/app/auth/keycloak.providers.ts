import { provideKeycloak, withAutoRefreshToken, AutoRefreshTokenService, UserActivityService } from 'keycloak-angular';
import { environment } from '../enviroments/environment';

export const keycloakProviders = provideKeycloak({
  config: {
    url:      environment.keycloak.url,
    realm:    environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  },
  // initOptions omitted — initialization is handled by keycloakInitFactory APP_INITIALIZER
  // which adds error handling for 401s caused by stale tokens or realm mismatches.
  features: [
    withAutoRefreshToken({
      onInactivityTimeout: 'logout',
      sessionTimeout:      300_000, // 5 min
    }),
  ],
  providers: [AutoRefreshTokenService, UserActivityService],
});
