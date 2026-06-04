// shared/components/layout/topbar/topbar.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { getInitials } from '../../../utils/format.utils';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  @Input() title = '';
  sidebarCollapsed = false;
  theme: 'light' | 'dark' = 'light';

  constructor(
    public uiState: UiStateService,
    public authState: AuthStateService,
  ) {}

  ngOnInit(): void {
    this.uiState.sidebarCollapsed$.subscribe(v => this.sidebarCollapsed = v);
    this.uiState.theme$.subscribe(v => this.theme = v);
  }

  toggleSidebar(): void {
    this.uiState.toggleSidebar();
  }

  toggleTheme(): void {
    this.uiState.toggleTheme();
  }

  getInitials(name: string): string {
    return getInitials(name);
  }
}