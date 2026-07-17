import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service'; 


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  forgotPasswordForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  isForgotPasswordMode = false;

  features = [
    'Real-time attendance tracking',
    'Automated fee management',
    'Advanced analytics & reports',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      passKey: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator = (g: FormGroup) => {
    const password = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  };

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  get fEmail() { return this.forgotPasswordForm.get('email')!; }
  get fPassKey() { return this.forgotPasswordForm.get('passKey')!; }
  get fNewPassword() { return this.forgotPasswordForm.get('newPassword')!; }
  get fConfirmPassword() { return this.forgotPasswordForm.get('confirmPassword')!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const { email, password } = this.form.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = 'Invalid email or password.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Please try again.';
        } else {
          this.error = err.error?.message ?? 'Something went wrong. Please try again.';
        }
      }
    });
  }

  toggleForgotPasswordMode(mode: boolean): void {
    this.isForgotPasswordMode = mode;
    this.error = null;
    if (mode) {
      this.successMessage = null;
    }
    this.form.reset({ rememberMe: false });
    this.forgotPasswordForm.reset();
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const { email, passKey, newPassword } = this.forgotPasswordForm.value;

    this.authService.resetPassword({ email, passKey, newPassword }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'Password reset successful! Please sign in with your new password.';
        this.toggleForgotPasswordMode(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.error = err.error?.message ?? 'Failed to reset password. Please verify your details.';
      }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
}