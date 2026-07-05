import { Component, OnInit } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
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

    if (user) {
      this.isEditMode = true;
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
    } else {
      this.form.get('adminPassword')?.setValidators(Validators.required);
      this.form.get('adminPassword')?.updateValueAndValidity();
    }
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

  cancel(): void {
    this.router.navigate(['/users']);
  }
}