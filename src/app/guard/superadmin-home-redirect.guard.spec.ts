import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { SuperAdminHomeRedirectGuard } from './superadmin-home-redirect.guard';

describe('SuperAdminHomeRedirectGuard', () => {
  let keycloakStub: Partial<Keycloak>;
  let routerSpy: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => (SuperAdminHomeRedirectGuard as CanActivateFn)(...args));

  beforeEach(() => {
    keycloakStub = { tokenParsed: {} };
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: Keycloak, useValue: keycloakStub },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should be defined', () => {
    expect(SuperAdminHomeRedirectGuard).toBeTruthy();
  });

  it('allows activation for a tenant member (has a /tenant/* group)', async () => {
    keycloakStub.tokenParsed = { groups: ['/tenant/rx-juveve'] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /system/academies for a superadmin (no /tenant/* group)', async () => {
    keycloakStub.tokenParsed = { groups: [] };
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system/academies']);
  });

  it('treats a missing groups claim as superadmin', async () => {
    keycloakStub.tokenParsed = {};
    const result = await executeGuard({} as any, {} as any);
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system/academies']);
  });
});
