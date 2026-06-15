// shared/components/layout/sidebar/sidebar.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  { label: 'Dashboard',         href: '/dashboard',         icon: 'layout-dashboard', roles: 'all' },
  { label: 'Students',          href: '/students',          icon: 'graduation-cap',   roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  
  // ✅ FIX 1: TEACHER role ko include kiya taaki dropdown menu Teachers login par hidden na ho
  { label: 'Teachers',          href: '/teachers',          icon: 'users',            roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  
  { label: 'Subjects',          href: '/subjects',          icon: 'book-open',        roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Class Timetable',   href: '/timetable',         icon: 'calendar-check',   roles: 'all' },
  { label: 'Teacher Timetable', href: '/teacher-timetable', icon: 'calendar-check',   roles: 'all' }, 
  { label: 'Attendance',        href: '/attendance',        icon: 'calendar-check',   roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Fees',              href: '/fees',              icon: 'credit-card',      roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT'] },
  { label: 'Reports',           href: '/reports',           icon: 'bar-chart-3',      roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'School',            href: '/school',            icon: 'book-open',        roles: 'all' },
  { label: 'Classes',           href: '/classes',           icon: 'book-open',        roles: 'all' },
  { label: 'Settings',          href: '/settings',          icon: 'settings',         roles: 'all' },
];

const TEACHERS_ROUTES = ['/teachers', '/teacher-mapping', '/subjects/assign-teacher', '/teacher-timetable'];
const SUBJECTS_ROUTES = ['/subjects/manage', '/subjects']; 

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  sidebarCollapsed = false;
  currentPath = '';
  currentRole: UserRole | null = null;
  teachersDropdownOpen = false;
  subjectsDropdownOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    public uiState: UiStateService,
    public authState: AuthStateService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.uiState.sidebarOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.sidebarOpen = v;
        this.cdr.markForCheck();
      });

    this.uiState.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.sidebarCollapsed = v;
        if (v) {
          this.teachersDropdownOpen = false;
          this.subjectsDropdownOpen = false;
        }
        this.cdr.markForCheck();
      });

    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentRole = (user?.role as UserRole) ?? null;
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _autoOpenDropdown(path: string): void {
    if (TEACHERS_ROUTES.some(r => path.startsWith(r))) {
      this.teachersDropdownOpen = true;
    }
    if (SUBJECTS_ROUTES.some(r => path.startsWith(r)) && !path.includes('assign-teacher')) {
      this.subjectsDropdownOpen = true;
    }
  }

  get filteredNavItems(): NavItem[] {
    const role = this.currentRole;
    return NAV_ITEMS.filter(item =>
      item.href !== '/teacher-timetable' && (item.roles === 'all' || (role && (item.roles as UserRole[]).includes(role)))
    );
  }

  isActive(href: string): boolean {
    return this.currentPath === href || this.currentPath.startsWith(href + '/');
  }

  isExactActive(href: string): boolean {
    return this.currentPath === href;
  }

  isTeachersActive(): boolean {
    return TEACHERS_ROUTES.some(r => this.currentPath.startsWith(r));
  }

  isSubjectsActive(): boolean {
    return SUBJECTS_ROUTES.some(r => this.currentPath.startsWith(r)) && !this.currentPath.includes('assign-teacher');
  }

  toggleTeachersDropdown(): void {
    this.teachersDropdownOpen = !this.teachersDropdownOpen;
    if (this.teachersDropdownOpen) this.subjectsDropdownOpen = false;
    this.cdr.markForCheck();
  }

  toggleSubjectsDropdown(): void {
    this.subjectsDropdownOpen = !this.subjectsDropdownOpen;
    if (this.subjectsDropdownOpen) this.teachersDropdownOpen = false;
    this.cdr.markForCheck();
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