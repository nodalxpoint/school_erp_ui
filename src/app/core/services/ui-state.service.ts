// core/services/ui-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private _sidebarOpen$ = new BehaviorSubject<boolean>(false);
  private _sidebarCollapsed$ = new BehaviorSubject<boolean>(false);
  private _theme$ = new BehaviorSubject<'light' | 'dark'>('light');

  sidebarOpen$ = this._sidebarOpen$.asObservable();
  sidebarCollapsed$ = this._sidebarCollapsed$.asObservable();
  theme$ = this._theme$.asObservable();

  constructor() {
    const saved = localStorage.getItem('erp-theme') as 'light' | 'dark' | null;
    if (saved) this.applyTheme(saved);
  }

  toggleSidebar(): void {
    this._sidebarOpen$.next(!this._sidebarOpen$.value);
  }

  setSidebarOpen(val: boolean): void {
    this._sidebarOpen$.next(val);
  }

  toggleCollapsed(): void {
    this._sidebarCollapsed$.next(!this._sidebarCollapsed$.value);
  }

  get sidebarCollapsed(): boolean {
    return this._sidebarCollapsed$.value;
  }

  toggleTheme(): void {
    const next = this._theme$.value === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

  get theme(): 'light' | 'dark' {
    return this._theme$.value;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this._theme$.next(theme);
    localStorage.setItem('erp-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}