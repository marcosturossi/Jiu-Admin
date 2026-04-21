import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';
import { SelectAcademyComponent } from './select-academy.component';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService } from '../../services/academy-session.service';

describe('SelectAcademyComponent', () => {
  let fixture: ComponentFixture<SelectAcademyComponent>;
  let component: SelectAcademyComponent;
  let publicServiceSpy: jasmine.SpyObj<PublicService>;
  let academySessionSpy: jasmine.SpyObj<AcademySessionService>;
  let keycloakStub: Partial<Keycloak>;
  let router: Router;

  beforeEach(async () => {
    publicServiceSpy = jasmine.createSpyObj('PublicService', ['apiPublicAcademiesSlugRealmGet']);
    academySessionSpy = jasmine.createSpyObj('AcademySessionService', ['setAcademy', 'clearAcademy', 'getAcademy', 'hasAcademy']);
    keycloakStub = { authenticated: false };

    await TestBed.configureTestingModule({
      imports: [SelectAcademyComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: PublicService, useValue: publicServiceSpy },
        { provide: AcademySessionService, useValue: academySessionSpy },
        { provide: Keycloak, useValue: keycloakStub },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SelectAcademyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the slug form', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('input')).toBeTruthy();
  });

  it('shows an error when slug is empty and form is submitted', () => {
    component['onSubmit']();
    fixture.detectChanges();
    expect(component['errorMsg']()).toBe('Por favor, informe o slug da academia.');
  });

  it('redirects to /system when already authenticated', () => {
    keycloakStub.authenticated = true;
    const navigateSpy = spyOn(router, 'navigate');
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/system']);
  });

  it('stores academy and calls navigateToRoot on successful API response', () => {
    publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(
      of({ keycloakUrl: 'http://kc:8180', realm: 'test-realm' }) as any
    );
    const navigateSpy = spyOn(component as any, 'navigateToRoot');

    component['slug'].set('test-academy');
    component['onSubmit']();

    expect(academySessionSpy.setAcademy).toHaveBeenCalledWith('test-academy', null, 'http://kc:8180', 'test-realm');
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('shows error message on API failure', () => {
    publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(throwError(() => new Error('Not found')));
    const navigateSpy = spyOn(component as any, 'navigateToRoot');

    component['slug'].set('bad-slug');
    component['onSubmit']();

    expect(component['errorMsg']()).toBe('Academia não encontrada. Verifique o slug e tente novamente.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('shows error when API returns incomplete realm info', () => {
    publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(of({ keycloakUrl: null, realm: null }) as any);
    const navigateSpy = spyOn(component as any, 'navigateToRoot');

    component['slug'].set('incomplete-slug');
    component['onSubmit']();

    expect(component['errorMsg']()).toBe('Academia não encontrada ou mal configurada. Verifique o slug.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
