import { TestBed } from '@angular/core/testing';
import { AcademySessionService, getStoredAcademy, AcademySession } from './academy-session.service';

const STORAGE_KEY = 'jiu_admin_academy';
const HISTORY_KEY = 'jiu_admin_academy_history';

const mockAcademy: AcademySession = {
  slug: 'test-academy',
  name: 'Test Academy',
  keycloakUrl: 'http://keycloak:8180',
  realm: 'test-realm',
};

describe('AcademySessionService', () => {
  let service: AcademySessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AcademySessionService);
  });

  afterEach(() => sessionStorage.clear());

  describe('getAcademy', () => {
    it('returns null when nothing is stored', () => {
      expect(service.getAcademy()).toBeNull();
    });

    it('returns parsed academy when stored', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      expect(service.getAcademy()).toEqual(mockAcademy);
    });

    it('returns null when stored value is invalid JSON', () => {
      sessionStorage.setItem(STORAGE_KEY, 'not-json{{{');
      expect(service.getAcademy()).toBeNull();
    });
  });

  describe('hasAcademy', () => {
    it('returns false when nothing is stored', () => {
      expect(service.hasAcademy()).toBeFalse();
    });

    it('returns true when academy is stored', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      expect(service.hasAcademy()).toBeTrue();
    });
  });

  describe('setAcademy', () => {
    it('stores the academy in sessionStorage', () => {
      service.setAcademy('my-slug', 'My Name', 'http://kc:8180', 'my-realm');
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);
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

    it('adds the new entry to history', () => {
      service.setAcademy('slug-a', null, 'http://kc', 'realm-a');
      const hist = service.getHistory();
      expect(hist.length).toBe(1);
      expect(hist[0].slug).toBe('slug-a');
    });

    it('places new entries at the front of history', () => {
      service.setAcademy('slug-a', null, 'http://kc', 'realm-a');
      service.setAcademy('slug-b', null, 'http://kc', 'realm-b');
      const hist = service.getHistory();
      expect(hist[0].slug).toBe('slug-b');
      expect(hist[1].slug).toBe('slug-a');
    });

    it('deduplicates slugs in history', () => {
      service.setAcademy('slug-a', null, 'http://kc', 'realm-a');
      service.setAcademy('slug-b', null, 'http://kc', 'realm-b');
      service.setAcademy('slug-a', null, 'http://kc', 'realm-a-updated');
      const hist = service.getHistory();
      expect(hist.length).toBe(2);
      expect(hist[0].slug).toBe('slug-a');
    });

    it('caps history at 5 entries', () => {
      for (let i = 1; i <= 7; i++) {
        service.setAcademy(`slug-${i}`, null, 'http://kc', `realm-${i}`);
      }
      expect(service.getHistory().length).toBe(5);
    });
  });

  describe('getHistory', () => {
    it('returns empty array when nothing stored', () => {
      expect(service.getHistory()).toEqual([]);
    });

    it('returns empty array on invalid JSON', () => {
      sessionStorage.setItem(HISTORY_KEY, 'bad{{{');
      expect(service.getHistory()).toEqual([]);
    });

    it('returns stored history array', () => {
      const hist = [mockAcademy];
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
      expect(service.getHistory()).toEqual(hist);
    });
  });

  describe('clearAcademy', () => {
    it('removes the stored academy', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
      service.clearAcademy();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('is safe to call when nothing is stored', () => {
      expect(() => service.clearAcademy()).not.toThrow();
    });
  });

  describe('clearHistory', () => {
    it('removes the history from sessionStorage', () => {
      service.setAcademy('slug-a', null, 'http://kc', 'realm-a');
      service.clearHistory();
      expect(service.getHistory()).toEqual([]);
    });

    it('is safe to call when no history exists', () => {
      expect(() => service.clearHistory()).not.toThrow();
    });
  });
});

describe('getStoredAcademy (standalone function)', () => {
  afterEach(() => sessionStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(getStoredAcademy()).toBeNull();
  });

  it('returns parsed academy when stored', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockAcademy));
    expect(getStoredAcademy()).toEqual(mockAcademy);
  });

  it('returns null on invalid JSON', () => {
    sessionStorage.setItem(STORAGE_KEY, '{bad');
    expect(getStoredAcademy()).toBeNull();
  });
});
