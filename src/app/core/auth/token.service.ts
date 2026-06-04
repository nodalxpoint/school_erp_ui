// core/auth/token.service.ts — Token & User helpers (localStorage + cookie)

import { Injectable } from '@angular/core';
import { User } from '../models/auth.model';

const TOKEN_KEY = 'erp_token';
const USER_KEY = 'erp_user';

@Injectable({ providedIn: 'root' })
export class TokenService {

  // ── Token ──────────────────────────────────────────────────────
  getToken(): string | null {
    const cookieVal = this.getCookieValue(TOKEN_KEY);
    return cookieVal ?? localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    localStorage.removeItem(TOKEN_KEY);
  }

  // ── User ───────────────────────────────────────────────────────
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // ── Clear All ─────────────────────────────────────────────────
  clearAll(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ── Cookie helper ─────────────────────────────────────────────
  private getCookieValue(name: string): string | null {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));
    return match ? match.split('=')[1] : null;
  }
}