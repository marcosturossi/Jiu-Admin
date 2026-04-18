import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { includeBearerTokenInterceptor } from 'keycloak-angular';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { keycloakProviders } from './auth/keycloak.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([includeBearerTokenInterceptor])
    ),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false },
      },
      ripple: true,
    }),
    keycloakProviders,
    MessageService,
  ]
};
