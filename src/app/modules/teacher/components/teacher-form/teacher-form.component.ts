// src/app/modules/teachers/components/teacher-form/teacher-form.component.ts

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { CreateTeacherDto, TeacherFormState } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-form.component.html',
  styleUrls: ['./teacher-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherFormComponent implements OnInit {
  isEditMode = false;
  isSubmitting = false;
  showPassword = false;
  userId = '';
  passKey = '';
  regenerating = false;

  form: TeacherFormState = this.blank();
  errors: Partial<TeacherFormState> = {};

    showResultPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  private popupTimer: any = null;
  private readonly POPUP_DURATION = 4000;


  constructor(
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = id;

      // ✅ STEP 1: Pehle check karo router state me current teacher object exist karta hai kya
      const navigation = this.router.getCurrentNavigation();
      const stateTeacher = navigation?.extras?.state?.['teacher'];

      if (stateTeacher) {
        this.mapTeacherToForm(stateTeacher);
      } else {
        // Fallback: Agar directly URL parse ya reload kiya ho toh API call chalegi
        this.loadTeacherDetails(id);
      }
    }
  }

  // ✅ Helper mapper to eliminate code redundancy and bind data perfectly
  mapTeacherToForm(teacher: any): void {
    this.form = {
      userId: teacher.teacherId ?? teacher.id ?? '',
      firstName: teacher.firstName ?? '',
      lastName: teacher.lastName ?? '',
      email: teacher.email ?? '',
      password: '',
      employeeCode: teacher.employeeCode ?? '',
      qualification: teacher.qualification ?? '',
      joiningDate: teacher.joiningDate?.substring(0, 10) ?? ''
    };
    this.passKey = teacher.passKey ?? '';
    this.cdr.markForCheck();
  }

  loadTeacherDetails(id: string): void {
    this.isSubmitting = true;
    this.cdr.markForCheck();

    // Query fallback wrapper
    this.teacherService.filterTeachers({ page: 0, size: 50, sortBy: 'createdAt', sortDirection: 'asc' }).subscribe({
      next: (res) => {
        // pure collection me se target check karo mapping match ke liye
        const teacher = res.data?.find((t: any) => t.teacherId === id || t.id === id);
        if (teacher) {
          this.mapTeacherToForm(teacher);
        }
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.firstName.trim()) this.errors.firstName = 'First name required';
    if (!this.form.email.trim()) this.errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errors.email = 'Invalid email';
    if (!this.isEditMode && !this.form.password.trim())
      this.errors.password = 'Password required for new teacher';
    return !Object.keys(this.errors).length;
  }

 onSubmit(): void {
  if (!this.validate()) return;

  this.isSubmitting = true;
  this.cdr.markForCheck();

  const dto: CreateTeacherDto = {
    firstName: this.form.firstName.trim(),
    lastName: this.form.lastName.trim() || undefined,
    email: this.form.email.trim(),
    employeeCode: this.form.employeeCode.trim() || undefined,
    qualification: this.form.qualification.trim() || undefined,
    joiningDate: this.form.joiningDate || undefined
  };

  if (this.isEditMode) {
    dto.userId = this.userId;
  } else {
    dto.password = this.form.password;
  }

  this.teacherService.addOrUpdateTeacher(dto).subscribe({
    next: (res: any) => {
      this.isSubmitting = false;

      this.popupType = 'success';
      this.popupMessage = res?.message || (this.isEditMode ? 'Teacher updated successfully!' : 'Teacher added successfully!');
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();
    },
    error: (err: any) => {
      this.isSubmitting = false;

      this.popupType = 'error';
      this.popupMessage = err?.error?.message || 'Failed to save teacher. Please try again.';
      this.showResultPopup = true;
      this.cdr.markForCheck();
      this.startPopupTimer();

      console.error('Save failed:', err);
    }
  });
}

private startPopupTimer(): void {
  if (this.popupTimer) clearTimeout(this.popupTimer);
  this.popupTimer = setTimeout(() => this.closePopup(), this.POPUP_DURATION);
}

closePopup(): void {
  if (this.popupTimer) { clearTimeout(this.popupTimer); this.popupTimer = null; }
  const wasSuccess = this.popupType === 'success';
  this.showResultPopup = false;
  this.cdr.markForCheck();
  if (wasSuccess) {
    this.router.navigate(['/teachers']);
  }
}

  onRegeneratePasskey(): void {
    if (!this.userId) return;

    this.regenerating = true;
    this.cdr.markForCheck();

    this.teacherService.regeneratePasskey(this.userId).subscribe({
      next: (res) => {
        this.regenerating = false;
        if (res.success) {
          this.passKey = res.data ?? '';
          this.popupType = 'success';
          this.popupMessage = `Passkey regenerated successfully: ${res.data}`;
          this.showResultPopup = true;
          this.startPopupTimer();
        } else {
          this.popupType = 'error';
          this.popupMessage = res.message || 'Failed to regenerate passkey.';
          this.showResultPopup = true;
          this.startPopupTimer();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.regenerating = false;
        this.popupType = 'error';
        this.popupMessage = err?.error?.message || 'Failed to regenerate passkey. Please try again.';
        this.showResultPopup = true;
        this.startPopupTimer();
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/teachers']);
  }

  private blank(): TeacherFormState {
    return {
      userId: '', firstName: '', lastName: '', email: '',
      password: '', employeeCode: '', qualification: '', joiningDate: ''
    };
  }
}