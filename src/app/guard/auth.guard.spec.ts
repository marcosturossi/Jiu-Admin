import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let keycloakStub: Partial<Keycloak>;

  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => (AuthGuard as CanActivateFn)(...args));

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    keycloakStub = {
      authenticated: false,
      realmAccess: { roles: [] },
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

  afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('should be defined', () => {
    expect(AuthGuard).toBeTruthy();
  });

  it('redirects to /select-academy when not authenticated and no academy stored', async () => {
    const result = await executeGuard({} as any, {} as any);
    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/select-academy']));
    expect(keycloakStub.login).not.toHaveBeenCalled();
  });

  it('calls keycloak.login when not authenticated but academy is stored', async () => {
    sessionStorage.setItem('jiu_admin_academy', JSON.stringify({
      slug: 'rx-juveve', name: null, keycloakUrl: 'http://localhost:8180', realm: 'test',
    }));
    const result = await executeGuard({} as any, {} as any);
    expect(keycloakStub.login).toHaveBeenCalledWith({ redirectUri: jasmine.stringContaining('/system') });
    expect(result).toBeFalse();
  });

  it('redirects to /select-academy instead of looping when login was already attempted', async () => {
    sessionStorage.setItem('jiu_admin_academy', JSON.stringify({
      slug: 'rx-juveve', name: null, keycloakUrl: 'http://localhost:8180', realm: 'test',
    }));
    sessionStorage.setItem('kc_login_in_progress', '1');
    const result = await executeGuard({} as any, {} as any);
    const router = TestBed.inject(Router);
    expect(keycloakStub.login).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('kc_auth_error')).toBe('auth_failed');
    expect(sessionStorage.getItem('jiu_admin_academy')).toBeNull();
    expect(result).toEqual(router.createUrlTree(['/select-academy']));
  });

  it('returns true when authenticated', async () => {
    keycloakStub.authenticated = true;
    keycloakStub.realmAccess = { roles: [] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
    expect(keycloakStub.logout).not.toHaveBeenCalled();
  });
});
