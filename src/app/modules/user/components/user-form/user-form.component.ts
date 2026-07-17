import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserResponseDto, SaveUserRequest } from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  saving = false;
  userId = '';
  passKey = '';
  regenerating = false;
  loadingUser = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      adminId: [null],
      adminFirstName: ['', Validators.required],
      adminLastName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPassword: [''],
      adminPhone: ['', Validators.required],
      role: ['ACCOUNTANT', Validators.required]
    });
  }

  ngOnInit(): void {
    const navState = this.router.getCurrentNavigation()?.extras.state
      || (history.state as { user?: UserResponseDto });
    const user = navState?.['user'] as UserResponseDto | undefined;

    if (user?.id) {
      this.isEditMode = true;
      this.userId = user.id;
      // Prefill immediately from nav state
      this.patchForm(user);

      // 🔥 Re-fetch fresh data from API to get latest passKey
      this.loadingUser = true;
      this.userService.listUsers({ page: 0, size: 10, userId: user.id }).subscribe({
        next: (res) => {
          this.loadingUser = false;
          const freshUser = res.data?.[0];
          if (freshUser) {
            this.patchForm(freshUser);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingUser = false;
        }
      });
    } else {
      this.form.get('adminPassword')?.setValidators(Validators.required);
      this.form.get('adminPassword')?.updateValueAndValidity();
    }
  }

  private patchForm(user: UserResponseDto): void {
    this.passKey = user.passKey ?? '';
    this.form.patchValue({
      adminId: user.id,
      adminFirstName: user.firstName,
      adminLastName: user.lastName,
      adminEmail: user.email,
      adminPhone: user.phoneNumber,
      role: user.role
    });
    this.form.get('adminPassword')?.clearValidators();
    this.form.get('adminPassword')?.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: SaveUserRequest = { ...this.form.value };

    if (this.isEditMode && !payload.adminPassword) {
      delete payload.adminPassword;
    }

    this.saving = true;
    this.userService.addOrUpdateUser(payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/users']);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  onRegeneratePasskey(): void {
    if (!this.userId) return;

    this.regenerating = true;
    this.userService.regeneratePasskey(this.userId).subscribe({
      next: (res) => {
        this.regenerating = false;
        if (res.success) {
          // 🔥 Update passKey display immediately with the new value returned by API
          this.passKey = res.data ?? '';
          this.cdr.detectChanges();
        } else {
          alert(res.message || 'Failed to regenerate passkey.');
        }
      },
      error: (err) => {
        this.regenerating = false;
        alert(err?.error?.message || 'Failed to regenerate passkey. Please try again.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}