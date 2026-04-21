import { Injectable } from '@angular/core';

export interface AcademySession {
  slug: string;
  name: string | null;
  keycloakUrl: string;
  realm: string;
}

const STORAGE_KEY = 'jiu_admin_academy';

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

  setAcademy(slug: string, name: string | null, keycloakUrl: string, realm: string): void {
    const session: AcademySession = { slug, name, keycloakUrl, realm };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clearAcademy(): void {
    localStorage.removeItem(STORAGE_KEY);
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
