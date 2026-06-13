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
    // Route se check karo ki id mil rahi hai ya nahi (Edit mode criteria)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = id;
      this.loadTeacherDetails(id);
    }
  }

  loadTeacherDetails(id: string): void {
    this.isSubmitting = true;
    // PagedResponse filter se single teacher details nikalenge fallback mechanism ke liye
    this.teacherService.filterTeachers({ page: 0, size: 1, firstName: id }).subscribe({
      next: (res) => {
        const teacher = res.data?.[0];
        if (teacher) {
          this.form = {
            userId: teacher.userId ?? teacher.id ?? '',
            firstName: teacher.firstName ?? '',
            lastName: teacher.lastName ?? '',
            email: teacher.email ?? '',
            password: '',
            employeeCode: teacher.employeeCode ?? '',
            qualification: teacher.qualification ?? '',
            joiningDate: teacher.joiningDate?.substring(0, 10) ?? ''
          };
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

    // Direct service hitting trigger
    this.teacherService.addOrUpdateTeacher(dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        // Action complete hone par teacher list page par navigate kar jao
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