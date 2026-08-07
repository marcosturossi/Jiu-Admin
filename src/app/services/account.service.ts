import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Hand-written (not OpenAPI-generated) — the generated_services client is regenerated from a
 * running backend instance, and this endpoint was added without one running. Uses environment.server
 * directly so it still picks up the bearer token via includeBearerTokenInterceptor (app.config.ts
 * matches requests by URL, not by which client issued them).
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  changePassword(dto: ChangePasswordDto): Observable<void> {
    return this.http.post<void>(`${environment.server}/api/account/me/change-password`, dto);
  }
}
