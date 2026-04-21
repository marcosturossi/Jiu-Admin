import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';
import { SelectAcademyComponent } from './select-academy.component';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService, AcademySession } from '../../services/academy-session.service';

const MOCK_ACADEMY: AcademySession = {
  slug: 'carlson-sp',
  name: null,
  keycloakUrl: 'http://kc:8180',
  realm: 'carlson-realm',
};

describe('SelectAcademyComponent', () => {
  let fixture: ComponentFixture<SelectAcademyComponent>;
  let component: SelectAcademyComponent;
  let publicServiceSpy: jasmine.SpyObj<PublicService>;
  let academySessionSpy: jasmine.SpyObj<AcademySessionService>;
  let keycloakStub: Partial<Keycloak>;
  let router: Router;

  function setup(history: AcademySession[] = [], current: AcademySession | null = null) {
    academySessionSpy.getHistory.and.returnValue(history);
    academySessionSpy.getAcademy.and.returnValue(current);
    fixture = TestBed.createComponent(SelectAcademyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    publicServiceSpy = jasmine.createSpyObj('PublicService', ['apiPublicAcademiesSlugRealmGet']);
    academySessionSpy = jasmine.createSpyObj('AcademySessionService', [
      'setAcademy', 'clearAcademy', 'getAcademy', 'hasAcademy', 'getHistory', 'clearHistory',
    ]);
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
  });

  describe('with no history', () => {
    beforeEach(() => setup([], null));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('renders the slug text input (no select)', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input#slug')).toBeTruthy();
      expect(el.querySelector('select#academySelect')).toBeNull();
    });

    it('shows an error when slug is empty and form is submitted', () => {
      component['onSubmit']();
      fixture.detectChanges();
      expect(component['errorMsg']()).toBe('Por favor, informe o slug da academia.');
    });

    it('stores academy and calls navigateToRoot on successful API response', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(
        of({ keycloakUrl: 'http://kc:8180', realm: 'test-realm' }) as any
      );
      const navigateSpy = spyOn(component as any, 'navigateToRoot');

      component['customSlug'].set('test-academy');
      component['onSubmit']();

      expect(academySessionSpy.setAcademy).toHaveBeenCalledWith('test-academy', null, 'http://kc:8180', 'test-realm');
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('shows error message on API failure', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(throwError(() => new Error('Not found')));
      const navigateSpy = spyOn(component as any, 'navigateToRoot');

      component['customSlug'].set('bad-slug');
      component['onSubmit']();

      expect(component['errorMsg']()).toBe('Academia não encontrada. Verifique o slug e tente novamente.');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('shows error when API returns incomplete realm info', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(of({ keycloakUrl: null, realm: null }) as any);
      const navigateSpy = spyOn(component as any, 'navigateToRoot');

      component['customSlug'].set('incomplete-slug');
      component['onSubmit']();

      expect(component['errorMsg']()).toBe('Academia não encontrada ou mal configurada. Verifique o slug.');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('redirects to /system when already authenticated', () => {
      keycloakStub.authenticated = true;
      const navigateSpy = spyOn(router, 'navigate');
      component.ngOnInit();
      expect(navigateSpy).toHaveBeenCalledWith(['/system']);
    });
  });

  describe('with history', () => {
    beforeEach(() => setup([MOCK_ACADEMY], MOCK_ACADEMY));

    it('shows the select dropdown and hides the text input', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('select#academySelect')).toBeTruthy();
      expect(el.querySelector('input#slug')).toBeNull();
    });

    it('pre-selects the current stored academy in the dropdown', () => {
      expect(component['selectedOption']()).toBe('carlson-sp');
    });

    it('showCustomInput is false when a history slug is selected', () => {
      component['selectedOption'].set('carlson-sp');
      expect(component['showCustomInput']()).toBeFalse();
    });

    it('showCustomInput is true when "other" is selected', () => {
      component['selectedOption'].set('other');
      fixture.detectChanges();
      expect(component['showCustomInput']()).toBeTrue();
      expect(fixture.nativeElement.querySelector('input#slug')).toBeTruthy();
    });

    it('submits with selected history slug and still validates via API', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(
        of({ keycloakUrl: 'http://kc:8180', realm: 'carlson-realm' }) as any
      );
      const navigateSpy = spyOn(component as any, 'navigateToRoot');

      component['selectedOption'].set('carlson-sp');
      component['onSubmit']();

      expect(publicServiceSpy.apiPublicAcademiesSlugRealmGet).toHaveBeenCalledWith('carlson-sp');
      expect(academySessionSpy.setAcademy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('shows error when history slug is no longer valid (API failure)', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(throwError(() => new Error()));
      component['selectedOption'].set('carlson-sp');
      component['onSubmit']();
      expect(component['errorMsg']()).toBe('Academia não encontrada. Verifique o slug e tente novamente.');
    });
  });

  describe('with history but current academy not in history', () => {
    beforeEach(() => setup([MOCK_ACADEMY], null));

    it('defaults selectedOption to "other" when no current matches history', () => {
      expect(component['selectedOption']()).toBe('other');
    });
  });
});
