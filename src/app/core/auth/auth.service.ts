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

        // JWT decode karo — backend se sub=email, userId, role aata hai
        let decoded: any = {};
        try {
          decoded = jwtDecode(token);
        } catch (e) {
          console.error('[AuthService] JWT decode failed', e);
        }

        // name JWT mein nahi hai — email se build karo (profile API baad mein)
        const email = decoded.sub ?? '';
        const nameFromEmail = email.split('@')[0] ?? 'User';

        const user: User = {
          id:    decoded.userId ?? '',
          name:  decoded.name ?? decoded.firstName
                   ? `${decoded.firstName} ${decoded.lastName ?? ''}`.trim()
                   : nameFromEmail,
          email,
          role,   // backend response se aata hai — 'SUPER_ADMIN' etc.
          schoolId: decoded.schoolId ?? '',
        };

        console.log('[AuthService] Storing user:', user); // debug — baad mein hata dena
        this.authState.setAuth(token, user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  register(payload: Omit<RegisterRequest, 'confirmPassword'>): Observable<AuthResponse> {
    return this.http.publicPost<AuthResponse>(ENDPOINTS.auth.register, payload).pipe(
      tap((res) => {
        this.authState.setAuth(res.token, res.user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  logout(): void {
    this.http.publicPost(ENDPOINTS.auth.logout, {}).subscribe({
      error: () => {},
      complete: () => this.clearAndRedirect(),
    });
    this.clearAndRedirect();
  }

  private clearAndRedirect(): void {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}