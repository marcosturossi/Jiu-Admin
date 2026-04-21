import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';
import { SelectAcademyComponent, PublicAcademyItem } from './select-academy.component';
import { PublicService } from '../../generated_services/api/public.service';
import { AcademySessionService, AcademySession } from '../../services/academy-session.service';
import { environment } from '../../enviroments/environment';

const MOCK_SESSION: AcademySession = {
  slug: 'carlson-sp',
  name: null,
  keycloakUrl: 'http://kc:8180',
  realm: 'carlson-realm',
};

const MOCK_LIST: PublicAcademyItem[] = [
  { slug: 'carlson-sp', name: 'Carlson Gracie SP' },
  { slug: 'carlson-rj', name: 'Carlson Gracie RJ' },
];

describe('SelectAcademyComponent', () => {
  let fixture: ComponentFixture<SelectAcademyComponent>;
  let component: SelectAcademyComponent;
  let publicServiceSpy: jasmine.SpyObj<PublicService>;
  let academySessionSpy: jasmine.SpyObj<AcademySessionService>;
  let keycloakStub: Partial<Keycloak>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    publicServiceSpy = jasmine.createSpyObj('PublicService', ['apiPublicAcademiesSlugRealmGet']);
    academySessionSpy = jasmine.createSpyObj('AcademySessionService', [
      'setAcademy', 'clearAcademy', 'getAcademy', 'hasAcademy', 'getHistory', 'clearHistory',
    ]);
    academySessionSpy.getAcademy.and.returnValue(null);
    academySessionSpy.getHistory.and.returnValue([]);
    keycloakStub = { authenticated: false };

    await TestBed.configureTestingModule({
      imports: [SelectAcademyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: PublicService,        useValue: publicServiceSpy },
        { provide: AcademySessionService, useValue: academySessionSpy },
        { provide: Keycloak,             useValue: keycloakStub },
      ],
    }).compileComponents();

    router   = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function create() {
    fixture   = TestBed.createComponent(SelectAcademyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function flushList(list: PublicAcademyItem[]) {
    httpMock.expectOne(`${environment.server}/api/public/academies`).flush(list);
    fixture.detectChanges();
  }

  function flushError() {
    httpMock.expectOne(`${environment.server}/api/public/academies`).error(new ProgressEvent('error'));
    fixture.detectChanges();
  }

  it('should create', () => {
    create();
    flushList([]);
    expect(component).toBeTruthy();
  });

  describe('loading state', () => {
    it('shows spinner and hides select while fetching', () => {
      create();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.spinner-border')).toBeTruthy();
      expect(el.querySelector('select')).toBeNull();
      flushList([]);
    });
  });

  describe('backend list loaded successfully', () => {
    beforeEach(() => {
      academySessionSpy.getAcademy.and.returnValue(MOCK_SESSION);
      create();
      flushList(MOCK_LIST);
    });

    it('shows dropdown with academy names', () => {
      const options = fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>;
      expect(options.length).toBe(2);
      expect(options[0].textContent?.trim()).toBe('Carlson Gracie SP');
      expect(options[1].textContent?.trim()).toBe('Carlson Gracie RJ');
    });

    it('does NOT show any text input', () => {
      expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('pre-selects the stored academy slug', () => {
      expect(component['selectedSlug']()).toBe('carlson-sp');
    });

    it('defaults to first academy when stored slug is not in list', () => {
      academySessionSpy.getAcademy.and.returnValue({ ...MOCK_SESSION, slug: 'unknown' });
      create();
      flushList(MOCK_LIST);
      expect(component['selectedSlug']()).toBe('carlson-sp');
    });

    it('submits selected slug and navigates on success', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(
        of({ keycloakUrl: 'http://kc:8180', realm: 'carlson-realm' }) as any
      );
      const navSpy = spyOn(component as any, 'navigateToRoot');
      component['selectedSlug'].set('carlson-rj');
      component['onSubmit']();
      expect(publicServiceSpy.apiPublicAcademiesSlugRealmGet).toHaveBeenCalledWith('carlson-rj');
      expect(academySessionSpy.setAcademy).toHaveBeenCalled();
      expect(navSpy).toHaveBeenCalled();
    });

    it('shows error when realm API fails', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(throwError(() => new Error()));
      component['onSubmit']();
      expect(component['errorMsg']()).toBeTruthy();
    });

    it('shows error when realm info is incomplete', () => {
      publicServiceSpy.apiPublicAcademiesSlugRealmGet.and.returnValue(
        of({ keycloakUrl: null, realm: null }) as any
      );
      component['onSubmit']();
      expect(component['errorMsg']()).toBeTruthy();
    });

    it('shows error when submitted with no slug selected', () => {
      component['selectedSlug'].set('');
      component['onSubmit']();
      expect(component['errorMsg']()).toBeTruthy();
    });
  });

  describe('backend list fetch fails', () => {
    beforeEach(() => { create(); flushError(); });

    it('shows an error alert instead of the form', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.alert-warning')).toBeTruthy();
      expect(el.querySelector('select')).toBeNull();
      expect(el.querySelector('form')).toBeNull();
    });

    it('does NOT show a text input', () => {
      expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });
  });

  it('redirects to /system when already authenticated', () => {
    keycloakStub.authenticated = true;
    const navSpy = spyOn(router, 'navigate');
    create();
    expect(navSpy).toHaveBeenCalledWith(['/system']);
  });
});

