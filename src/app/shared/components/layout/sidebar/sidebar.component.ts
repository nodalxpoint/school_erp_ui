// shared/components/layout/sidebar/sidebar.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { getInitials } from '../../../utils/format.utils';
import { UserRole } from '../../../../core/models/auth.model';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[] | 'all';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'layout-dashboard', roles: 'all' },
  { label: 'Students',   href: '/students',   icon: 'graduation-cap',   roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  { label: 'Teachers',   href: '/teachers',   icon: 'users',            roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Attendance', href: '/attendance', icon: 'calendar-check',   roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Fees',       href: '/fees',       icon: 'credit-card',      roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT'] },
  { label: 'Reports',    href: '/reports',    icon: 'bar-chart-3',      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'School',     href: '/school',     icon: 'book-open',        roles: 'all' },
  { label: 'Classes',    href: '/classes',    icon: 'book-open',        roles: 'all' },
  { label: 'Settings',   href: '/settings',   icon: 'settings',         roles: 'all' },
];

// Routes jahan teachers dropdown active rahe
const TEACHERS_ROUTES = ['/teachers', '/teacher-mapping'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  sidebarCollapsed = false;
  currentPath = '';
  currentRole: UserRole | null = null;
  teachersDropdownOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    public uiState: UiStateService,
    public authState: AuthStateService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.uiState.sidebarOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.sidebarOpen = v);

    this.uiState.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.sidebarCollapsed = v;
        if (v) this.teachersDropdownOpen = false;
      });

    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentRole = (user?.role as UserRole) ?? null;
      });

    this.currentPath = this.router.url;
    this._autoOpenDropdown(this.currentPath);

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e: any) => {
        this.currentPath = e.urlAfterRedirects;
        this._autoOpenDropdown(this.currentPath);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Auto-open teachers dropdown when on any teachers-related route */
  private _autoOpenDropdown(path: string): void {
    if (TEACHERS_ROUTES.some(r => path.startsWith(r))) {
      this.teachersDropdownOpen = true;
    }
  }

  get filteredNavItems(): NavItem[] {
    const role = this.currentRole;
    return NAV_ITEMS.filter(item =>
      item.roles === 'all' || (role && (item.roles as UserRole[]).includes(role))
    );
  }

  /** Prefix match — used for parent routes like /teachers/assign, /teachers/add */
  isActive(href: string): boolean {
    return this.currentPath === href || this.currentPath.startsWith(href + '/');
  }

  /** Exact match — used for /teachers and /teachers/add to avoid both being active */
  isExactActive(href: string): boolean {
    return this.currentPath === href;
  }

  isTeachersActive(): boolean {
    return TEACHERS_ROUTES.some(r => this.currentPath.startsWith(r));
  }

  toggleTeachersDropdown(): void {
    this.teachersDropdownOpen = !this.teachersDropdownOpen;
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  logout(): void {
    this.authService.logout();
  }

  closeSidebar(): void {
    this.uiState.setSidebarOpen(false);
  }

  toggleCollapsed(): void {
    this.uiState.toggleCollapsed();
  }
}