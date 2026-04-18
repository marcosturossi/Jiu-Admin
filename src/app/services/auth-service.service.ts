import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthServiceService {
  private readonly keycloak = inject(Keycloak);
  private readonly router   = inject(Router);

  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  getUsernameFromToken(): string | null {
    return (this.keycloak.tokenParsed?.['preferred_username'] as string) ?? null;
  }

  getRoles(): string[] {
    const realmRoles    = this.keycloak.realmAccess?.roles ?? [];
    const resourceRoles = Object.values(this.keycloak.resourceAccess ?? {})
      .flatMap(r => r.roles);
    return [...new Set([...realmRoles, ...resourceRoles])];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  async logout(): Promise<void> {
    await this.keycloak.logout({ redirectUri: window.location.origin });
  }

  /** @deprecated Keycloak handles redirect automatically via initOptions.onLoad */
  redirectToLogin(): void {
    this.keycloak.login();
  }
}

