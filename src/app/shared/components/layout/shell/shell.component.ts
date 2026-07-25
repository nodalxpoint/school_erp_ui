// shared/components/layout/shell/shell.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { FeatureFlagService } from '../../../../core/services/feature-flag.service';
import { SchoolProfileService } from '../../../../core/services/school-profile.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  sidebarCollapsed = false;

  constructor(
    private uiState: UiStateService,
    private featureFlags: FeatureFlagService,
    private schoolProfile: SchoolProfileService,
  ) {}

  ngOnInit(): void {
    this.uiState.sidebarCollapsed$.subscribe(v => this.sidebarCollapsed = v);

    // Warms the cache so the sidebar reflects disabled modules without a flash of
    // items that then disappear. featureGuard is the actual enforcement — this is
    // just so the nav renders correctly on the first paint.
    this.featureFlags.ensureLoaded().subscribe();

    // Warms the school-logo cache for the topbar.
    this.schoolProfile.ensureLoaded().subscribe();
  }
}