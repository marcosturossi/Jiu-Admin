import { TestBed } from '@angular/core/testing';
import { AcademySessionService, getStoredAcademy, AcademySession } from './academy-session.service';

const STORAGE_KEY = 'jiu_admin_academy';

const mockAcademy: AcademySession = {
  slug: 'test-academy',
  name: 'Test Academy',
  keycloakUrl: 'http://keycloak:8180',
  realm: 'test-realm',
};

describe('AcademySessionService', () => {
  let service: AcademySessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AcademySessionService);
  });

  afterEach(() => localStorage.clear());

  describe('getAcademy', () => {
    it('returns null when nothing is stored', () => {
      expect(service.getAcademy()).toBeNull();
    });

    it('returns parsed academy when stored', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      expect(service.getAcademy()).toEqual(mockAcademy);
    });

    it('returns null when stored value is invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json{{{');
      expect(service.getAcademy()).toBeNull();
    });
  });

  describe('hasAcademy', () => {
    it('returns false when nothing is stored', () => {
      expect(service.hasAcademy()).toBeFalse();
    });

    it('returns true when academy is stored', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      expect(service.hasAcademy()).toBeTrue();
    });
  });

  describe('setAcademy', () => {
    it('stores the academy in localStorage', () => {
      service.setAcademy('my-slug', 'My Name', 'http://kc:8180', 'my-realm');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual({
        slug: 'my-slug',
        name: 'My Name',
        keycloakUrl: 'http://kc:8180',
        realm: 'my-realm',
      });
    });

    it('accepts null name', () => {
      service.setAcademy('s', null, 'http://url', 'r');
      expect(service.getAcademy()?.name).toBeNull();
    });
  });

  describe('clearAcademy', () => {
    it('removes the stored academy', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      service.clearAcademy();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('is safe to call when nothing is stored', () => {
      expect(() => service.clearAcademy()).not.toThrow();
    });
  });
});

describe('getStoredAcademy (standalone function)', () => {
  afterEach(() => localStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(getStoredAcademy()).toBeNull();
  });

  it('returns parsed academy when stored', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
    expect(getStoredAcademy()).toEqual(mockAcademy);
  });

  it('returns null on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    expect(getStoredAcademy()).toBeNull();
  });
});
