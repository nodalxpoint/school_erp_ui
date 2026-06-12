import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-management.component.html',
  styleUrls: ['./teacher-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherManagementComponent {
  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, 3500);
  }
}