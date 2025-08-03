import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from "@angular/core";
import { Router } from '@angular/router';
import { throwError, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { AuthServiceService } from '../services/auth-service.service';
import { AuthService as GeneratedAuthService } from '../generated_services/api/auth.service';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!decoded.exp) return true;
    // Consider expired if less than 10s left, but give a small buffer for network latency
    return (decoded.exp * 1000) < (Date.now() + 5000); // 5 seconds buffer
  } catch {
    return true;
  }
}

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthServiceService);
  const generatedAuthService = inject(GeneratedAuthService);
  const router = inject(Router);

  if (req.url.includes('login') || req.url.includes('refresh')) {
      return next(req);
  }

  const { token, refreshToken } = authService.loadToken();

  function handle401() {
    authService.saveToken('', '');
    router.navigate(['authentication/login']);
    return throwError(() => new Error('Unauthorized or session expired. Please log in again.'));
  }

  function proceedWithToken(accessToken: string) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return handle401();
        }
        return throwError(() => error);
      })
    );
  }

  if (token && !isTokenExpired(token)) {
    return proceedWithToken(token);
  }
  if (isTokenExpired(token) && refreshToken) {
    console.log('Token expired, attempting to refresh...');
    return generatedAuthService.apiAuthRefreshPost({ refreshToken }).pipe(
      switchMap((res: any) => {
        if (res.access_token && res.refresh_token) {
          authService.saveToken(res.access_token, res.refresh_token);
          console.log('Token refreshed successfully. Retrying original request.');
          return proceedWithToken(res.access_token);
        } else {
          console.error('Refresh token response missing tokens.');
          return handle401();
        }
      }),
      catchError((refreshError: HttpErrorResponse) => {
        console.error('Failed to refresh token:', refreshError);
        // Só redireciona para login se for 401 ou 403, senão propaga o erro normalmente
        if (refreshError.status === 401 || refreshError.status === 403) {
          return handle401();
        }
        return throwError(() => refreshError);
      })
    );
  }

  return next(req);
};
