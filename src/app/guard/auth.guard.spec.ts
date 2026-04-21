import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let keycloakStub: Partial<Keycloak>;

  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => (AuthGuard as CanActivateFn)(...args));

  beforeEach(() => {
    keycloakStub = { authenticated: false, realmAccess: { roles: [] } };
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

  it('redirects to /select-academy when not authenticated', async () => {
    keycloakStub.authenticated = false;
    const result = await executeGuard({} as any, {} as any);
    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/select-academy']));
  });

  it('returns false when authenticated but no roles', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: [] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
  });

  it('returns false when only manage-realm role is present', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: ['manage-realm'] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
  });

  it('returns false when only manage-users role is present', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: ['manage-users'] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
  });

  it('returns true when authenticated with both manage-realm and manage-users roles', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: ['manage-realm', 'manage-users'] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
  });
});
