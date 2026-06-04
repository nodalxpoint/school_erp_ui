// modules/auth/register/register.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserRole } from '../../../core/models/auth.model';

export interface RoleOption {
  value: UserRole;
  label: string;
  desc: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  isLoading = false;
  error: string | null = null;
  showPassword = false;
  showConfirm = false;

  roles: RoleOption[] = [
    { value: 'ADMIN',   label: 'Admin',   desc: 'Full access' },
    { value: 'TEACHER', label: 'Teacher', desc: 'Manage classes' },
    { value: 'STUDENT', label: 'Student', desc: 'View only' },
    { value: 'PARENT',  label: 'Parent',  desc: 'Child info' },
  ];

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      role: ['ADMIN'],
      name:  ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: AbstractControl) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p && c && p !== c ? { passwordMismatch: true } : null;
  }

  get name() { return this.form.get('name')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
  get selectedRole(): UserRole { return this.form.get('role')!.value; }

  get passwordStrength(): { score: number; label: string; color: string } | null {
    const p = this.password.value as string;
    if (!p) return null;
    const checks = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)];
    const score = checks.filter(Boolean).length;
    const map = [
      { score: 1, label: 'Weak',   color: 'hsl(var(--destructive))' },
      { score: 2, label: 'Fair',   color: 'hsl(var(--warning))' },
      { score: 3, label: 'Good',   color: 'hsl(var(--accent))' },
      { score: 4, label: 'Strong', color: 'hsl(var(--success))' },
    ];
    return map[Math.min(score, 4) - 1] ?? null;
  }

  selectRole(role: UserRole): void {
    this.form.patchValue({ role });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.error = null;
    const { confirmPassword, ...payload } = this.form.value;
    this.authService.register(payload).subscribe({
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.error = err?.error?.message ?? (err.status === 409 ? 'Email already registered.' : 'Something went wrong.');
      },
      complete: () => { this.isLoading = false; }
    });
  }
}