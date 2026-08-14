import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let keycloakStub: Partial<Keycloak>;

  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => (AuthGuard as CanActivateFn)(...args));

  beforeEach(() => {
    keycloakStub = {
      authenticated: false,
      realmAccess: { roles: ['admin'] },
      login:  jasmine.createSpy('login').and.returnValue(Promise.resolve()),
      logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Keycloak, useValue: keycloakStub },
      ],
    });
  });

  it('should be defined', () => {
    expect(AuthGuard).toBeTruthy();
  });

  it('returns true when authenticated', async () => {
    keycloakStub.authenticated = true;
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
    expect(keycloakStub.login).not.toHaveBeenCalled();
  });

  it('calls keycloak.login and returns false when not authenticated', async () => {
    keycloakStub.authenticated = false;
    const result = await executeGuard({} as any, {} as any);
    expect(keycloakStub.login).toHaveBeenCalledWith({
      redirectUri: jasmine.stringContaining('/system'),
    });
    expect(result).toBeFalse();
  });

  it('navigates to /forbidden and returns false when authenticated but lacking manager/admin role', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: ['some-other-role'] };
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.stub();

    const result = await executeGuard({} as any, {} as any);

    expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
    expect(result).toBeFalse();
  });
});
