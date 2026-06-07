import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService, TeacherStateService } from '../../services/teacher.service';
import { CreateTeacherRequest } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode   = false;
  teacherId: string | null = null;
  submitting   = false;
  successMsg   = '';
  errorMsg     = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private teacherState: TeacherStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.teacherId  = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.teacherId;
    this.buildForm();
    if (this.isEditMode) this.patchData();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      firstName:     ['', [Validators.required, Validators.minLength(2)]],
      lastName:      ['', [Validators.required, Validators.minLength(2)]],
      email:         ['', [Validators.required, Validators.email]],
      password:      ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      employeeCode:  ['', Validators.required],
      qualification: ['', Validators.required],
      joiningDate:   ['', Validators.required],
    });
  }

  private patchData(): void {
    const t = this.teacherState.get();
    if (!t) {
      this.errorMsg = 'Teacher data not found. Please go back to the list and click Edit again.';
      this.cdr.markForCheck();
      return;
    }
    this.form.patchValue({
      firstName:     t.firstName,
      lastName:      t.lastName,
      email:         t.email,
      employeeCode:  t.employeeCode,
      qualification: t.qualification ?? '',
      joiningDate:   t.joiningDate   ?? '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.cdr.markForCheck(); return; }
    this.submitting = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const v = this.form.value;
    const payload: CreateTeacherRequest = {
      firstName:     v.firstName,
      lastName:      v.lastName,
      email:         v.email,
      employeeCode:  v.employeeCode,
      qualification: v.qualification,
      joiningDate:   v.joiningDate,
    };
    if (v.password) payload.password = v.password;
    if (this.isEditMode) {
      const t = this.teacherState.get();
      if (t?.userId) payload.userId = t.userId;
    }

    this.teacherService.saveTeacher(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.successMsg = this.isEditMode ? 'Teacher updated successfully!' : 'Teacher added successfully!';
          this.teacherState.clear();
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['teachers', 'list']), 1200);
        } else {
          this.errorMsg = res.message || 'Something went wrong.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'Failed to save teacher. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void { this.teacherState.clear(); this.router.navigate(['teachers', 'list']); }
  togglePassword(): void { this.showPassword = !this.showPassword; }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c && c.invalid && c.touched);
  }

  getError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors) return '';
    if (c.errors['required'])  return 'This field is required.';
    if (c.errors['email'])     return 'Enter a valid email address.';
    if (c.errors['minlength']) return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    return 'Invalid value.';
  }
}
