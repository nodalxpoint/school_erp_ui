// shared/components/layout/sidebar/sidebar.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { SchoolProfileService } from '../../../../core/services/school-profile.service';
import { getInitials } from '../../../utils/format.utils';
import { UserRole } from '../../../../core/models/auth.model';
import { FeatureKey } from '../../../../core/models/feature.model';
import { SchoolProfile } from '../../../../core/models/school-profile.model';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[] | 'all';
  featureKey?: FeatureKey;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Schools', href: '/schools', icon: 'layout-dashboard', roles: ['PLATFORM_ADMIN'] },
  { label: 'Platform Admins', href: '/schools/admins', icon: 'users', roles: ['PLATFORM_ADMIN'] },
  { label: 'Admin Dashboard', href: '/dashboard', icon: 'layout-dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', roles: ['TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT'] },
  { label: 'Classes', href: '/classes', icon: 'building', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Students', href: '/students', icon: 'graduation-cap', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'UDISE Compliance', href: '/udise', icon: 'shield-check', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Teachers', href: '/teachers', icon: 'users', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
  { label: 'Subjects', href: '/subjects', icon: 'book-open', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Class Timetable', href: '/timetable', icon: 'calendar-check', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Exams Module', href: '/exams', icon: 'exam-sheet', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Exam-Marks', href: '/exam-marks', icon: 'check-square', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Attendance', href: '/attendance', icon: 'calendar-check', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Student Progression', href: '/students/progression', icon: 'graduation-cap', roles: ['TEACHER'] },


  // ✅ PARENT LINKS ENCODED SAFELY MATCHING BACKEND ROLE SPEC
  { label: 'Children Attendance', href: '/parent/attendance', icon: 'calendar-check', roles: ['PARENT'], featureKey: 'ATTENDANCE' },
  { label: 'Exam Results', href: '/parent/exams', icon: 'exam-sheet', roles: ['PARENT'], featureKey: 'EXAMS' },
  { label: 'Class Timetable', href: '/parent/timetable', icon: 'calendar-days', roles: ['PARENT'], featureKey: 'TIMETABLE' },
  { label: 'Children Fees', href: '/parent/fees', icon: 'credit-card', roles: ['PARENT'], featureKey: 'FEES' },

  { label: 'Fees', href: '/fees', icon: 'credit-card', roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'], featureKey: 'FEES' },
  { label: 'Student Fees', href: '/fees', icon: 'credit-card', roles: ['ACCOUNTANT'], featureKey: 'FEES' },
  { label: 'Fee Structure', href: '/fee-structure', icon: 'exam-sheet', roles: ['ACCOUNTANT'], featureKey: 'FEES' },
  { label: 'Fee History', href: '/fees/history', icon: 'bar-chart-3', roles: ['ACCOUNTANT'], featureKey: 'FEES' },
  { label: 'Users', href: '/users', icon: 'users', roles: ['SUPER_ADMIN'] },
  { label: 'Reports', href: '/reports', icon: 'bar-chart-3', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'], featureKey: 'REPORTS' },
  { label: 'Profile', href: '/profile', icon: 'user', roles: 'all' },
];

const TEACHERS_ROUTES = ['/teachers', '/teacher-mapping', '/subjects/assign-teacher', '/teacher-timetable'];
const SUBJECTS_ROUTES = ['/subjects/manage', '/subjects'];
const EXAMS_ROUTES = ['/exams', '/exam-schedule'];
const FEES_ROUTES = ['/fees', '/fee-structure'];

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
  schoolProfile: SchoolProfile | null = null;

  teachersDropdownOpen = false;
  subjectsDropdownOpen = false;
  examsDropdownOpen = false;
  feesDropdownOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    public uiState: UiStateService,
    public authState: AuthStateService,
    private authService: AuthService,
    private featureFlags: FeatureFlagService,
    private schoolProfile$: SchoolProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.uiState.sidebarOpen$.pipe(takeUntil(this.destroy$)).subscribe(v => { this.sidebarOpen = v; this.cdr.markForCheck(); });
    this.uiState.sidebarCollapsed$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.sidebarCollapsed = v;
      if (v) {
        this.teachersDropdownOpen = false;
        this.subjectsDropdownOpen = false;
        this.examsDropdownOpen = false;
        this.feesDropdownOpen = false;
      }
      this.cdr.markForCheck();
    });

    this.gameStateTrackingInit();

    this.currentPath = this.router.url;
    this._autoOpenDropdown(this.currentPath);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this.currentPath = e.urlAfterRedirects;
      this._autoOpenDropdown(this.currentPath);
      this.cdr.markForCheck();
    });
  }

  gameStateTrackingInit(): void {
    this.authState.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user && user.role) {
        this.currentRole = user.role as UserRole;
      } else {
        this.currentRole = null;
      }
      this.cdr.markForCheck();
    });

    // Re-render once feature flags resolve so disabled modules drop out of the nav
    // without needing a route change to trigger it.
    this.featureFlags.ensureLoaded().pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());

    // School branding in the sidebar (tenant users only — see template).
    this.schoolProfile$.profileChanges$.pipe(takeUntil(this.destroy$)).subscribe(profile => {
      this.schoolProfile = profile;
      this.cdr.markForCheck();
    });
  }

  get isPlatformAdmin(): boolean {
    return this.currentRole === 'PLATFORM_ADMIN';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _autoOpenDropdown(path: string): void {
    if (TEACHERS_ROUTES.some(r => path.startsWith(r))) this.teachersDropdownOpen = true;
    if (SUBJECTS_ROUTES.some(r => path.startsWith(r)) && !path.includes('assign-teacher')) this.subjectsDropdownOpen = true;
    if (EXAMS_ROUTES.some(r => path.startsWith(r))) this.examsDropdownOpen = true;
    if (FEES_ROUTES.some(r => path.startsWith(r))) this.feesDropdownOpen = true;
  }

  get filteredNavItems(): NavItem[] {
    const role = this.currentRole;
    const byRole = !role
      ? NAV_ITEMS.filter(item => item.roles === 'all')
      : NAV_ITEMS.filter(item => item.roles === 'all' || (Array.isArray(item.roles) && item.roles.includes(role)));

    return byRole.filter(item => !item.featureKey || this.featureFlags.isEnabled(item.featureKey));
  }

  isActive(href: string): boolean { return this.currentPath === href || this.currentPath.startsWith(href + '/'); }
  isExactActive(href: string): boolean { return this.currentPath === href; }
  isTeachersActive(): boolean { return TEACHERS_ROUTES.some(r => this.currentPath.startsWith(r)); }
  isSubjectsActive(): boolean { return SUBJECTS_ROUTES.some(r => this.currentPath.startsWith(r)) && !this.currentPath.includes('assign-teacher'); }
  isExamsActive(): boolean { return EXAMS_ROUTES.some(r => this.currentPath.startsWith(r)); }
  isFeesActive(): boolean { return FEES_ROUTES.some(r => this.currentPath.startsWith(r)); }
isStudentFeesActive(): boolean {
  return this.isExactActive('/fees') ||
    (this.currentPath.startsWith('/fees/') && !this.currentPath.startsWith('/fees/history'));
}

isFeeHistoryActive(): boolean {
  return this.isExactActive('/fees/history');
}

// '/schools/admins' is its own nav item, so plain startsWith('/schools/') would
// also light up the 'Schools' item while on the Platform Admins page.
isSchoolsActive(): boolean {
  return this.currentPath === '/schools'
    || (this.currentPath.startsWith('/schools/') && !this.currentPath.startsWith('/schools/admins'));
}
  toggleTeachersDropdown(): void {
    this.teachersDropdownOpen = !this.teachersDropdownOpen;
    if (this.teachersDropdownOpen) { this.subjectsDropdownOpen = false; this.examsDropdownOpen = false; }
    this.cdr.markForCheck();
  }

  toggleSubjectsDropdown(): void {
    this.subjectsDropdownOpen = !this.subjectsDropdownOpen;
    if (this.subjectsDropdownOpen) { this.teachersDropdownOpen = false; this.examsDropdownOpen = false; }
    this.cdr.markForCheck();
  }

  toggleExamsDropdown(): void {
    this.examsDropdownOpen = !this.examsDropdownOpen;
    if (this.examsDropdownOpen) { this.teachersDropdownOpen = false; this.subjectsDropdownOpen = false; this.feesDropdownOpen = false; }
    this.cdr.markForCheck();
  }

  toggleFeesDropdown(): void {
    this.feesDropdownOpen = !this.feesDropdownOpen;
    if (this.feesDropdownOpen) { this.teachersDropdownOpen = false; this.subjectsDropdownOpen = false; this.examsDropdownOpen = false; }
    this.cdr.markForCheck();
  }

  getInitials(name: string): string { return getInitials(name); }

  logout(): void {
    this.teachersDropdownOpen = false;
    this.subjectsDropdownOpen = false;
    this.examsDropdownOpen = false;
    this.feesDropdownOpen = false;
    this.authService.logout();
    this.cdr.markForCheck();
  }

  closeSidebar(): void { this.uiState.setSidebarOpen(false); }
  toggleCollapsed(): void { this.uiState.toggleCollapsed(); }
}