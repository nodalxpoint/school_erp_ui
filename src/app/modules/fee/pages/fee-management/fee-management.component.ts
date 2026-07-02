import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fee-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="management-container">
      <header class="management-header">
        <h1>Fee Management</h1>
        <p>Admin Dashboard: Manage and track student fee payments.</p>
      </header>
      
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .management-container {
      padding: 2rem;
      background: var(--bg-page);
      min-height: 100vh;
    }
    .management-header {
      margin-bottom: 2rem;
      h1 { color: var(--text-primary); margin-bottom: 0.5rem; }
      p { color: var(--text-muted); }
    }
  `]
})
export class FeeManagementComponent {}