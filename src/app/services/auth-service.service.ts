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
    if (token.token != "") {
      return true
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
}
