import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthServiceService } from './auth-service.service';

describe('AuthServiceService', () => {
  let service: AuthServiceService;
  let keycloakStub: Partial<Keycloak>;

  function setup(stub: Partial<Keycloak> = {}) {
    keycloakStub = {
      authenticated: false,
      tokenParsed: {},
      realmAccess: { roles: [] },
      resourceAccess: {},
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      ...stub,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Keycloak, useValue: keycloakStub },
      ],
    });
    service = TestBed.inject(AuthServiceService);
  }

  it('should be created', () => {
    setup();
    expect(service).toBeTruthy();
  });

  it('isLoggedIn() returns false when not authenticated', () => {
    setup({ authenticated: false });
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn() returns true when authenticated', () => {
    setup({ authenticated: true });
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('getUsernameFromToken() returns null when tokenParsed is empty', () => {
    setup({ tokenParsed: {} });
    expect(service.getUsernameFromToken()).toBeNull();
  });

  it('getUsernameFromToken() returns preferred_username from token', () => {
    setup({ tokenParsed: { preferred_username: 'marcos' } as any });
    expect(service.getUsernameFromToken()).toBe('marcos');
  });

  it('getRoles() returns realm roles', () => {
    setup({ realmAccess: { roles: ['manage-realm', 'manage-users'] } });
    expect(service.getRoles()).toContain('manage-realm');
    expect(service.getRoles()).toContain('manage-users');
  });

  it('getRoles() merges realm and resource access roles', () => {
    setup({
      realmAccess: { roles: ['realm-role'] },
      resourceAccess: { myClient: { roles: ['resource-role'] } },
    });
    const roles = service.getRoles();
    expect(roles).toContain('realm-role');
    expect(roles).toContain('resource-role');
  });

  it('hasRole() returns true when role is present', () => {
    setup({ realmAccess: { roles: ['admin'] } });
    expect(service.hasRole('admin')).toBeTrue();
  });

  it('hasRole() returns false when role is absent', () => {
    setup({ realmAccess: { roles: ['user'] } });
    expect(service.hasRole('admin')).toBeFalse();
  });

  it('hasAnyRole() returns true when at least one role matches', () => {
    setup({ realmAccess: { roles: ['manage-users'] } });
    expect(service.hasAnyRole(['admin', 'manage-users'])).toBeTrue();
  });

  it('hasAnyRole() returns false when no role matches', () => {
    setup({ realmAccess: { roles: ['user'] } });
    expect(service.hasAnyRole(['admin', 'superuser'])).toBeFalse();
  });

  it('isSuperAdmin() returns true when the token has no /tenant/* group', () => {
    setup({ tokenParsed: { groups: ['/some-other-group'] } as any });
    expect(service.isSuperAdmin()).toBeTrue();
  });

  it('isSuperAdmin() returns true when the token has no groups claim at all', () => {
    setup({ tokenParsed: {} });
    expect(service.isSuperAdmin()).toBeTrue();
  });

  it('isSuperAdmin() returns false when the token has a /tenant/* group', () => {
    setup({ tokenParsed: { groups: ['/tenant/rx-juveve'] } as any });
    expect(service.isSuperAdmin()).toBeFalse();
  });
});
