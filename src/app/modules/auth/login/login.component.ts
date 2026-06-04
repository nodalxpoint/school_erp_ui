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
  isLoading = false;
  error: string | null = null;
  showPassword = false;

  features = [
    'Real-time attendance tracking',
    'Automated fee management',
    'Advanced analytics & reports',
  ];

 constructor(
  private fb: FormBuilder,
  private router: Router,
  private authService: AuthService, // REPLACE authState + http se
) {
  this.form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });
}

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

 submit(): void {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.isLoading = true;
  this.error = null;

  const { email, password } = this.form.value;

  this.authService.login({ email, password }).subscribe({
    next: () => {
      // AuthService khud navigate karega /dashboard pe
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

  togglePassword(): void { this.showPassword = !this.showPassword; }
}