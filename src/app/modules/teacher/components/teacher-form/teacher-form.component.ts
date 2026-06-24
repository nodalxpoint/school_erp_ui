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

  form: TeacherFormState = this.blank();
  errors: Partial<TeacherFormState> = {};

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
      next: (res) => {
        this.isSubmitting = false;
        this.router.navigate(['/teachers']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        console.error('Save failed:', err);
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