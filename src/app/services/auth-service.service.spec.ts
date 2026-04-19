import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Keycloak from 'keycloak-js';

import { AuthServiceService } from './auth-service.service';

describe('AuthServiceService', () => {
  let service: AuthServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Keycloak,
          useValue: {
            authenticated: false,
            tokenParsed: {},
            realmAccess: { roles: [] },
            resourceAccess: {},
            isLoggedIn: () => Promise.resolve(false),
            getToken: () => Promise.resolve(''),
            login: () => Promise.resolve(),
            logout: () => Promise.resolve(),
          }
        }
      ]
    });
    service = TestBed.inject(AuthServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
