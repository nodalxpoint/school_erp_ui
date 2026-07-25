// core/auth/auth-state.service.ts — Global auth state using BehaviorSubject

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../models/auth.model';
import { TokenService } from './token.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private _user$ = new BehaviorSubject<User | null>(null);
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);

  readonly user$: Observable<User | null> = this._user$.asObservable();
  readonly isAuthenticated$: Observable<boolean> = this._isAuthenticated$.asObservable();
  readonly userRole$ = this._user$.pipe(map(u => u?.role));

  constructor(private tokenService: TokenService) {
    this.initialize();
  }

  initialize(): void {
    const token = this.tokenService.getToken();
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        // Token has expired, clean up session
        this.tokenService.clearAll();
        return;
      }

      // Pehle localStorage se try karo
      let user = this.tokenService.getUser();

      // Agar user nahi mila — token decode karo
      if (!user) {
        const builtUser: User = {
          id:       decoded.userId ?? decoded.sub ?? '',
          name:     decoded.name ?? decoded.email ?? decoded.sub ?? '',
          email:    decoded.sub ?? '',
          role:     decoded.role as UserRole,
          schoolId: decoded.schoolId ?? '',   // ← FIX 1: schoolId add kiya
          platformAdminAccessLevel: decoded.platformAdminAccessLevel ?? null,
        };
        this.tokenService.setUser(builtUser); // ← FIX 2: null nahi, typed User
        user = builtUser;
      }

      this._user$.next(user);
      this._isAuthenticated$.next(true);
    } catch {
      this.tokenService.clearAll();
      return;
    }
  }

  setAuth(token: string, user: User): void {
    this.tokenService.setToken(token);
    this.tokenService.setUser(user);
    this._user$.next(user);
    this._isAuthenticated$.next(true);
  }

  clearAuth(): void {
    this.tokenService.clearAll();
    this._user$.next(null);
    this._isAuthenticated$.next(false);
  }

  get currentUser(): User | null {
    return this._user$.value;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  // True for every role except a platform admin explicitly marked VIEW_ONLY.
  // Null/undefined access level is treated as EDIT to match the backend's
  // grandfathering of platform admins created before this field existed.
  get canEditAsPlatformAdmin(): boolean {
    const user = this.currentUser;
    if (!user || user.role !== 'PLATFORM_ADMIN') return false;
    return user.platformAdminAccessLevel !== 'VIEW_ONLY';
  }
}