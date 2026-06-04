// core/auth/auth-state.service.ts — Global auth state using BehaviorSubject

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/auth.model';
import { TokenService } from './token.service';

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
    const user = this.tokenService.getUser();
    if (token && user) {
      this._user$.next(user);
      this._isAuthenticated$.next(true);
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
}