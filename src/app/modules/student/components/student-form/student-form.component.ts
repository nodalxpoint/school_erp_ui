import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, StudentStateService } from '../../services/student.service';
import { CreateStudentRequest, DropdownOption } from '../../models/student.model';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  studentId: string | null = null;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  // Dropdown options from params API
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  loadingClasses = false;
  loadingSections = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private studentState: StudentStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.studentId;

    this.buildForm();
    this.loadClasses();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      firstName:         ['', [Validators.required, Validators.minLength(2)]],
      lastName:          ['', [Validators.required, Validators.minLength(2)]],
      gender:            ['', Validators.required],
      dob:               ['', Validators.required],
      admissionDate:     ['', Validators.required],
      rollNo:            ['', Validators.required],
      classId:           ['', Validators.required],
      sectionId:         ['', Validators.required],
      academicSessionId: ['', Validators.required],
      fatherName:        ['', Validators.required],
      motherName:        ['', Validators.required],
      emergencyContact:  ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      parentFirstName:   ['', Validators.required],
      parentLastName:    ['', Validators.required],
      parentEmail:       ['', [Validators.required, Validators.email]],
      parentPhone:       ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      parentPassword:    ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
    });
  }

  // ─── Params API — dropdowns ─────────────────────────────────────

  loadClasses(): void {
    this.loadingClasses = true;
    this.studentService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.loadingClasses = false;

        // Ab edit student ka data patch karte hain (classes load hone ke baad)
        if (this.isEditMode) {
          this.patchEditData();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClasses = false;
        this.errorMessage = 'Could not load classes.';
        this.cdr.markForCheck();
      },
    });
  }

  onClassChange(): void {
    const classId = this.form.get('classId')?.value;
    this.form.patchValue({ sectionId: '' });
    this.sections = [];
    if (classId) {
      this.loadSections(classId);
    }
  }

  loadSections(classId: string): void {
    this.loadingSections = true;
    this.studentService.getSections(classId).subscribe({
      next: (data) => {
        this.sections = data;
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Edit: state service se data patch karo ──────────────────────

  private patchEditData(): void {
    const student = this.studentState.getEditStudent();

    if (!student) {
      // State clear ho gayi (page refresh etc.) — list pe wapas jaao
      this.errorMessage =
        'Student data not found. Please go back to the list and click Edit again.';
      this.cdr.markForCheck();
      return;
    }

    this.form.patchValue({
      firstName:         student.firstName,
      lastName:          student.lastName,
      gender:            student.gender ?? '',
      dob:               student.dob ?? '',
      admissionDate:     student.admissionDate ?? '',
      rollNo:            student.rollNo ?? '',
      classId:           student.classId ?? '',
      sectionId:         student.sectionId ?? '',
      academicSessionId: student.academicSessionId ?? '',
      fatherName:        student.fatherName ?? '',
      motherName:        student.motherName ?? '',
      emergencyContact:  student.emergencyContact ?? '',
      parentFirstName:   student.parentFirstName ?? '',
      parentLastName:    student.parentLastName ?? '',
      parentEmail:       student.parentEmail ?? '',
      parentPhone:       student.parentPhone ?? '',
    });

    // Password optional in edit mode
    this.form.get('parentPassword')?.clearValidators();
    this.form.get('parentPassword')?.updateValueAndValidity();

    // Load sections for the pre-filled classId
    if (student.classId) {
      this.loadSections(student.classId);
    }

    this.cdr.markForCheck();
  }

  // ─── Submit ─────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formVal = this.form.value;
    const payload: CreateStudentRequest = { ...formVal };

    if (this.isEditMode && this.studentId) {
      payload.studentId = this.studentId;
    }

    // Remove password if empty on edit
    if (!payload.parentPassword) {
      delete payload.parentPassword;
    }

    this.studentService.saveStudent(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.successMessage = this.isEditMode
            ? 'Student updated successfully!'
            : 'Student added successfully!';
          this.studentState.clear();
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['students', 'list']), 1200);
        } else {
          this.errorMessage = res.message || 'Something went wrong.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage =
          err?.error?.message || 'Failed to save student. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.studentState.clear();
    this.router.navigate(['students', 'list']);
  }

  // ─── Validation helpers ─────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required'])   return 'This field is required.';
    if (ctrl.errors['email'])      return 'Enter a valid email address.';
    if (ctrl.errors['minlength'])  return `Minimum ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['pattern'])    return 'Enter a valid phone number (e.g. +919876543210).';
    return 'Invalid value.';
  }
}
