// core/auth/auth.service.ts — Auth API calls + state management

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthStateService } from './auth-state.service';
import { ENDPOINTS } from '../services/endpoints';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private http: HttpService,
    private authState: AuthStateService,
    private router: Router,
  ) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.publicPost<AuthResponse>(ENDPOINTS.auth.login, payload).pipe(
      tap((res) => {
        this.authState.setAuth(res.token, res.user);
        // Role-based redirect
        this.redirectAfterLogin(res.user.role);
      })
    );
  }

  register(payload: Omit<RegisterRequest, 'confirmPassword'>): Observable<AuthResponse> {
    return this.http.publicPost<AuthResponse>(ENDPOINTS.auth.register, payload).pipe(
      tap((res) => {
        this.authState.setAuth(res.token, res.user);
        this.redirectAfterLogin(res.user.role);
      })
    );
  }

  logout(): void {
    this.http.publicPost(ENDPOINTS.auth.logout, {}).subscribe({
      error: () => {},
      complete: () => this.clearAndRedirect(),
    });
    // Clear immediately regardless of API response
    this.clearAndRedirect();
  }

  private clearAndRedirect(): void {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  // Role-based dashboard redirect
  private redirectAfterLogin(role: string): void {
    // All roles go to /dashboard — the dashboard component renders role-specific content
    this.router.navigate(['/dashboard']);
  }
}