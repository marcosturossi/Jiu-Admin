import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { includeBearerTokenInterceptor, INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG } from 'keycloak-angular';

import { routes } from './app.routes';
import { keycloakProviders } from './auth/keycloak.providers';
import { keycloakInitFactory } from './auth/keycloak-init.factory';
import { BASE_PATH as BASE_PATH_API1 } from './generated_services/variables';
import { BASE_PATH as BASE_PATH_API2 } from './generated_services/api2/variables';
import { environment } from './enviroments/environment';
import { ThemeService } from './services/theme.service';

const urlPattern = (base: string) =>
  new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([includeBearerTokenInterceptor])
    ),
    provideToastr({
      timeOut: 4000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    keycloakProviders,
    { provide: BASE_PATH_API1, useValue: environment.server },
    { provide: BASE_PATH_API2, useValue: environment.face_api },
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        { urlPattern: urlPattern(environment.server) },
        { urlPattern: urlPattern(environment.face_api) },
      ],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: keycloakInitFactory,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService) => () => {
        // Theme service initializes itself on instantiation
        return Promise.resolve();
      },
      deps: [ThemeService],
      multi: true,
    },
  ]
};
