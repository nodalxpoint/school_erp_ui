// shared/components/layout/sidebar/sidebar.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { getInitials } from '../../../utils/format.utils';
import { UserRole } from '../../../../core/models/auth.model';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[] | 'all';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',   icon: 'layout-dashboard',    roles: 'all' },
  { label: 'Students',    href: '/students',    icon: 'graduation-cap',      roles: ['admin', 'teacher'] },
  { label: 'Teachers',    href: '/teachers',    icon: 'users',               roles: ['admin'] },
  { label: 'Attendance',  href: '/attendance',  icon: 'calendar-check',      roles: ['admin', 'teacher', 'student'] },
  { label: 'Fees',        href: '/fees',        icon: 'credit-card',         roles: ['admin', 'student', 'parent'] },
  { label: 'Reports',     href: '/reports',     icon: 'bar-chart-3',         roles: ['admin'] },
  { label: 'Classes',     href: '/classes',     icon: 'book-open',           roles: ['admin', 'teacher'] },
  { label: 'Settings',    href: '/settings',    icon: 'settings',            roles: 'all' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  sidebarOpen = false;
  sidebarCollapsed = false;
  currentPath = '';

  constructor(
    public uiState: UiStateService,
    public authState: AuthStateService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.uiState.sidebarOpen$.subscribe(v => this.sidebarOpen = v);
    this.uiState.sidebarCollapsed$.subscribe(v => this.sidebarCollapsed = v);
    this.currentPath = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentPath = e.urlAfterRedirects);
  }

  get filteredNavItems(): NavItem[] {
    const role = this.authState.currentUser?.role;
    return NAV_ITEMS.filter(item =>
      item.roles === 'all' || (role && item.roles.includes(role))
    );
  }

  isActive(href: string): boolean {
    return this.currentPath === href || this.currentPath.startsWith(href + '/');
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