import { Injectable } from '@angular/core';

export interface AcademySession {
  slug: string;
  name: string | null;
  keycloakUrl: string;
  realm: string;
}

const STORAGE_KEY = 'jiu_admin_academy';
const HISTORY_KEY = 'jiu_admin_academy_history';
const MAX_HISTORY = 5;

@Injectable({ providedIn: 'root' })
export class AcademySessionService {

  getAcademy(): AcademySession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AcademySession) : null;
    } catch {
      return null;
    }
  }

  hasAcademy(): boolean {
    return this.getAcademy() !== null;
  }

  getHistory(): AcademySession[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as AcademySession[]) : [];
    } catch {
      return [];
    }
  }

  setAcademy(slug: string, name: string | null, keycloakUrl: string, realm: string): void {
    const session: AcademySession = { slug, name, keycloakUrl, realm };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    const history = this.getHistory().filter(h => h.slug !== slug);
    history.unshift(session);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  clearAcademy(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  }
}

/** Reads the stored academy session synchronously (for use outside injection context). */
export function getStoredAcademy(): AcademySession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AcademySession) : null;
  } catch {
    return null;
  }
}
