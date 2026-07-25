import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SchoolService } from '../services/school.service';
import { CreateSchoolResult, School } from '../models/school.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';

// Validators.required treats a whitespace-only string as present — this catches it.
function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && !control.value.trim() ? { whitespace: true } : null;
}

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

@Component({
  selector: 'app-school-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './school-form.component.html',
  styleUrls: ['./school-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  schoolId: string | null = null;
  isSaving = false;
  error: string | null = null;

  // Shown once after a successful create — never retrievable again after this.
  createdResult: CreateSchoolResult | null = null;

  constructor(
    private fb: FormBuilder,
    private schoolService: SchoolService,
    private authState: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      schoolName: ['', [Validators.required, noWhitespaceValidator(), Validators.maxLength(150)]],
      schoolCode: ['', [Validators.required, noWhitespaceValidator(), Validators.minLength(2), Validators.maxLength(20), Validators.pattern(CODE_PATTERN)]],
      schoolEmail: ['', [Validators.email, Validators.maxLength(150)]],
      schoolPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
      address: ['', [Validators.maxLength(500)]],
      city: ['', [Validators.maxLength(100)]],
      state: ['', [Validators.maxLength(100)]],
      country: ['', [Validators.maxLength(100)]],
      logoUrl: ['', [Validators.maxLength(500)]],
      adminFirstName: ['', [Validators.maxLength(100)]],
      adminLastName: ['', [Validators.maxLength(100)]],
      adminEmail: ['', [Validators.email, Validators.maxLength(150)]],
      adminPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
    });
  }

  ngOnInit(): void {
    if (!this.authState.canEditAsPlatformAdmin) {
      this.router.navigate(['/schools']);
      return;
    }

    this.schoolId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.schoolId;

    if (this.isEditMode) {
      this.form.get('adminFirstName')?.clearValidators();
      this.form.get('adminEmail')?.clearValidators();

      const navState = history.state as { school?: School };
      if (navState?.school) {
        this.form.patchValue({
          schoolName: navState.school.schoolName,
          schoolCode: navState.school.schoolCode,
          schoolEmail: navState.school.email ?? '',
          schoolPhone: navState.school.phone ?? '',
          address: navState.school.address ?? '',
          city: navState.school.city ?? '',
          state: navState.school.state ?? '',
          country: navState.school.country ?? '',
          logoUrl: navState.school.logoUrl ?? '',
        });
      }
    } else {
      this.form.get('adminFirstName')?.setValidators([Validators.required, noWhitespaceValidator(), Validators.maxLength(100)]);
      this.form.get('adminEmail')?.setValidators([Validators.required, Validators.email, Validators.maxLength(150)]);
    }
    this.form.get('adminFirstName')?.updateValueAndValidity();
    this.form.get('adminEmail')?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;
    const v = this.form.value;

    if (this.isEditMode && this.schoolId) {
      this.schoolService.updateSchool(this.schoolId, {
        schoolName: v.schoolName,
        schoolCode: v.schoolCode,
        schoolEmail: v.schoolEmail,
        schoolPhone: v.schoolPhone,
        address: v.address,
        city: v.city,
        state: v.state,
        country: v.country,
        logoUrl: v.logoUrl,
      }).subscribe({
        next: () => {
          this.router.navigate(['/schools'], {
            state: { toast: { message: 'School updated successfully', type: 'success' } },
          });
        },
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
    } else {
      this.schoolService.createSchool({
        schoolName: v.schoolName,
        schoolCode: v.schoolCode,
        schoolEmail: v.schoolEmail,
        schoolPhone: v.schoolPhone,
        address: v.address,
        city: v.city,
        state: v.state,
        country: v.country,
        logoUrl: v.logoUrl,
        adminFirstName: v.adminFirstName,
        adminLastName: v.adminLastName,
        adminEmail: v.adminEmail,
        adminPhone: v.adminPhone,
      }).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.createdResult = result;
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
    }
  }

  private handleError(err: HttpErrorResponse): void {
    this.isSaving = false;

    const validationErrors = err.error?.validationErrors as Record<string, string> | undefined;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      this.error = Object.entries(validationErrors).map(([field, msg]) => `${field}: ${msg}`).join('; ');
    } else {
      this.error = err.error?.message ?? 'Something went wrong. Please try again.';
    }

    this.cdr.markForCheck();
  }

  copyPassword(): void {
    if (this.createdResult) {
      navigator.clipboard?.writeText(this.createdResult.adminTemporaryPassword);
    }
  }

  doneAfterCreate(): void {
    this.router.navigate(['/schools']);
  }

  cancel(): void {
    this.router.navigate(['/schools']);
  }
}
