// shared/components/layout/shell/shell.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { UiStateService } from '../../../../core/services/ui-state.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  sidebarCollapsed = false;

  constructor(private uiState: UiStateService) {}

  ngOnInit(): void {
    this.uiState.sidebarCollapsed$.subscribe(v => this.sidebarCollapsed = v);
  }
}