// core/auth/auth.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthStateService } from './auth-state.service';
import { ENDPOINTS } from '../services/endpoints';
import { LoginRequest, RegisterRequest, AuthResponse, LoginApiResponse, User } from '../models/auth.model';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private http: HttpService,
    private authState: AuthStateService,
    private router: Router,
  ) {}

  login(payload: LoginRequest): Observable<LoginApiResponse> {
    return this.http.publicPost<LoginApiResponse>(ENDPOINTS.auth.login, payload).pipe(
      tap((res) => {
        if (!res?.data?.token) {
          console.error('[AuthService] login: token missing in response', res);
          return;
        }

        const { token, role } = res.data;
        const user = this.decodeToUser(token, role);

        this.authState.setAuth(token, user);

        // PLATFORM_ADMIN has no school of its own — there's nothing for it on the
        // per-school /dashboard, so it lands on the schools list instead.
        if (role === 'PLATFORM_ADMIN') {
          this.router.navigate(['/schools']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  // Platform-admin-only: "view as" a specific tenant user by email, without ever
  // touching their password. Backend logs every call (who impersonated whom, when).
  impersonate(email: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>('/platform-admin/impersonate', { email }).pipe(
      tap((res) => {
        if (!res?.data?.token) {
          console.error('[AuthService] impersonate: token missing in response', res);
          return;
        }

        const { token, role } = res.data;
        const user = this.decodeToUser(token, role);

        this.authState.setAuth(token, user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  private decodeToUser(token: string, role: LoginApiResponse['data']['role']): User {
    let decoded: any = {};
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      console.error('[AuthService] JWT decode failed', e);
    }

    const email = decoded.sub ?? '';
    const nameFromEmail = email.split('@')[0] ?? 'User';

    return {
      id:    decoded.userId ?? '',
      name:  decoded.name ?? decoded.firstName
               ? `${decoded.firstName} ${decoded.lastName ?? ''}`.trim()
               : nameFromEmail,
      email,
      role,
      schoolId: decoded.schoolId ?? '',
    };
  }

  resetPassword(payload: { email: string; passKey: string; newPassword: string }): Observable<any> {
    return this.http.publicPost<any>('/resetPassword', payload);
  }

  register(payload: Omit<RegisterRequest, 'confirmPassword'>): Observable<AuthResponse> {
    return this.http.publicPost<AuthResponse>(ENDPOINTS.auth.register, payload).pipe(
      tap((res) => {
        this.authState.setAuth(res.token, res.user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>('/users/profile');
  }

  // ✅ FIXED: No backend call now, directly cleans state instantly from client side
  logout(): void {
    this.clearAndRedirect();
  }

  private clearAndRedirect(): void {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}