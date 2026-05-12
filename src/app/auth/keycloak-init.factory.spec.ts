import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import { keycloakInitFactory } from './keycloak-init.factory';

describe('keycloakInitFactory', () => {
  let keycloakStub: jasmine.SpyObj<Keycloak>;

  beforeEach(() => {
    keycloakStub = jasmine.createSpyObj<Keycloak>('Keycloak', ['init', 'login']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Keycloak, useValue: keycloakStub },
      ],
    });
  });

  function runFactory(): Promise<void> {
    return TestBed.runInInjectionContext(() => keycloakInitFactory())();
  }

  it('should resolve without calling login when init succeeds', async () => {
    keycloakStub.init.and.returnValue(Promise.resolve(true));

    await runFactory();

    expect(keycloakStub.init).toHaveBeenCalledOnceWith({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    });
    expect(keycloakStub.login).not.toHaveBeenCalled();
  });

  it('should clear keycloak storage and call login when init rejects', async () => {
    keycloakStub.init.and.returnValue(Promise.reject(new Error('401 Unauthorized')));
    keycloakStub.login.and.returnValue(Promise.resolve());

    // Seed storage with keycloak-related keys and unrelated ones
    sessionStorage.setItem('kc-token', 'stale-token');
    sessionStorage.setItem('keycloak-session', 'abc');
    sessionStorage.setItem('unrelated-key', 'keep-me');
    localStorage.setItem('kc-callback', 'value');
    localStorage.setItem('other', 'keep-me-too');

    await runFactory();

    expect(keycloakStub.login).toHaveBeenCalledOnceWith({
      redirectUri: jasmine.stringContaining('/system'),
    });

    // Keycloak keys must be cleared
    expect(sessionStorage.getItem('kc-token')).toBeNull();
    expect(sessionStorage.getItem('keycloak-session')).toBeNull();
    expect(localStorage.getItem('kc-callback')).toBeNull();

    // Unrelated keys must remain
    expect(sessionStorage.getItem('unrelated-key')).toBe('keep-me');
    expect(localStorage.getItem('other')).toBe('keep-me-too');

    // Cleanup
    sessionStorage.removeItem('unrelated-key');
    localStorage.removeItem('other');
  });
});
