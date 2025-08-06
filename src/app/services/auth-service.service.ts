import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  constructor(private router:Router) { }

  saveToken(token: string, refreshToken: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  loadToken(): { token: string | null, refreshToken: string | null } {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    return { token, refreshToken };
  }

  clearToken() {
    sessionStorage.setItem(this.TOKEN_KEY, "");
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, "");
  }

  isLoggedIn(): boolean {
    let token = this.loadToken()
    if (token.token && token.token !== "") {
      return true;
    }
    return false
  }

  redirectToLogin() {
    this.router.navigate(["/login"])
  }

  getUsernameFromToken(): string | null {
    const { token } = this.loadToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded.preferred_username || decoded.name 
    } catch {
      return null;
    }
  }

  getRoles(): string[] {
    const { token } = this.loadToken();
    if (!token) return [];
    
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      // Keycloak typically stores roles in different places, check all possibilities
      const roles: string[] = [];
      
      // Check realm_access.roles for realm-level roles
      if (decoded.realm_access?.roles) {
        roles.push(...decoded.realm_access.roles);
      }
      
      // Check resource_access for client-specific roles
      if (decoded.resource_access) {
        Object.keys(decoded.resource_access).forEach(client => {
          if (decoded.resource_access[client]?.roles) {
            roles.push(...decoded.resource_access[client].roles);
          }
        });
      }
      
      // Check for direct roles claim (some setups use this)
      if (decoded.roles && Array.isArray(decoded.roles)) {
        roles.push(...decoded.roles);
      }
      
      // Remove duplicates and return
      return [...new Set(roles)];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRoles();
    return roles.some(role => userRoles.includes(role));
  }
}
