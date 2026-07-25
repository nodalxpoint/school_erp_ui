import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SchoolService } from '../services/school.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { CreatePlatformAdminResult, PlatformAdmin, PlatformAdminAccessLevel } from '../models/school.model';

@Component({
  selector: 'app-platform-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './platform-admins.component.html',
  styleUrls: ['./platform-admins.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformAdminsComponent implements OnInit {
  admins: PlatformAdmin[] = [];
  isLoading = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  canEdit = false;
  currentUserId: string | null = null;

  showAddPanel = false;
  form: FormGroup;
  isSaving = false;
  error: string | null = null;
  createdResult: CreatePlatformAdminResult | null = null;

  // id -> in-flight row edit state, so multiple rows can be edited independently
  editingRowId: string | null = null;
  rowSaving = false;

  constructor(
    private fb: FormBuilder,
    private schoolService: SchoolService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      accessLevel: ['VIEW_ONLY' as PlatformAdminAccessLevel, Validators.required],
    });
  }

  ngOnInit(): void {
    this.canEdit = this.authState.canEditAsPlatformAdmin;
    this.currentUserId = this.authState.currentUser?.id ?? null;

    if (!this.canEdit) {
      // View-only platform admins can still see this page (backend allows GET /admins
      // for any PLATFORM_ADMIN) but can't create/edit — no point routing them elsewhere.
    }

    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.schoolService.listPlatformAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load platform admins', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  toggleAddPanel(): void {
    this.showAddPanel = !this.showAddPanel;
    this.createdResult = null;
    this.error = null;
    if (this.showAddPanel) {
      this.form.reset({ firstName: '', lastName: '', email: '', accessLevel: 'VIEW_ONLY' });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;
    const v = this.form.value;

    this.schoolService
      .createPlatformAdmin({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        accessLevel: v.accessLevel,
      })
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          this.createdResult = result;
          this.cdr.markForCheck();
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving = false;
          this.error = err.error?.message ?? 'Something went wrong. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  copyPassword(): void {
    if (this.createdResult) {
      navigator.clipboard?.writeText(this.createdResult.temporaryPassword);
    }
  }

  doneAfterCreate(): void {
    this.showAddPanel = false;
    this.createdResult = null;
  }

  startEditRow(admin: PlatformAdmin): void {
    this.editingRowId = admin.id;
  }

  cancelEditRow(): void {
    this.editingRowId = null;
  }

  saveRow(admin: PlatformAdmin, accessLevel: string, isActive: boolean): void {
    this.rowSaving = true;
    this.schoolService.updatePlatformAdmin(admin.id, { accessLevel: accessLevel as PlatformAdminAccessLevel, isActive }).subscribe({
      next: (updated) => {
        this.rowSaving = false;
        this.editingRowId = null;
        this.admins = this.admins.map((a) => (a.id === updated.id ? updated : a));
        this.showToast('Platform admin updated', 'success');
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.rowSaving = false;
        this.showToast(err.error?.message ?? 'Failed to update platform admin', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  back(): void {
    this.router.navigate(['/schools']);
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3500);
  }
}
