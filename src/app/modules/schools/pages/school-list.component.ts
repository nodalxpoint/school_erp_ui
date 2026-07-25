import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SchoolService } from '../services/school.service';
import { School } from '../models/school.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './school-list.component.html',
  styleUrls: ['./school-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolListComponent implements OnInit {
  schools: School[] = [];
  isLoading = false;
  search = '';
  toast: { message: string; type: 'success' | 'error' } | null = null;
  canEdit = false;

  constructor(
    private schoolService: SchoolService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.canEdit = this.authState.canEditAsPlatformAdmin;
  }

  ngOnInit(): void {
    const state = history.state as { toast?: { message: string; type: 'success' | 'error' } };
    if (state?.toast) this.showToast(state.toast.message, state.toast.type);
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.schoolService.listSchools(this.search).subscribe({
      next: (data) => {
        this.schools = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load schools', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(): void {
    this.load();
  }

  onAdd(): void {
    this.router.navigate(['/schools/form']);
  }

  onEdit(school: School): void {
    this.router.navigate(['/schools/form', school.id], { state: { school } });
  }

  onView(school: School): void {
    this.router.navigate(['/schools', school.id]);
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3500);
  }
}
