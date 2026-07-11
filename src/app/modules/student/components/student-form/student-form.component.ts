import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, StudentStateService } from '../../services/student.service';
import { CreateStudentRequest, DropdownOption, ParentSearchResultDto, StudentResponseDto } from '../../models/student.model';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  studentId: string | null = null;
  submitting = false;
  loadingStudent = false;   // ✅ naya
  successMessage = '';
  errorMessage = '';

  showPassword = false;

  parentMode: 'NONE' | 'NEW' | 'EXISTING' = 'NONE';
  parentSearchQuery = '';
  parentSearchResults: ParentSearchResultDto[] = [];
  searchingParents = false;
  selectedParentId: string | null = null;

  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  academicSessions: DropdownOption[] = [];
  loadingClasses = false;
  loadingSections = false;
  loadingAcademicSessions = false;

  // ✅ naya — patch sequencing ke liye
  private loadedStudent: StudentResponseDto | null = null;
  private classesReady = false;
  private studentReady = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private studentState: StudentStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.studentId;

    if (this.isEditMode) {
      this.parentMode = 'NEW';
    }

    this.buildForm();
    this.loadClasses();

    if (this.isEditMode && this.studentId) {
      this.loadStudentData(this.studentId);
    }
  }

  // ✅ naya method — same /students/list API id ke sath
  private loadStudentData(id: string): void {
    this.loadingStudent = true;
    this.studentService.getStudentById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.errorMessage = 'Student not found.';
        } else {
          this.loadedStudent = data;
        }
        this.studentReady = true;
        this.loadingStudent = false;
        this.tryPatchEdit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Failed to load student data. Please try again.';
        this.studentReady = true;
        this.loadingStudent = false;
        this.tryPatchEdit();
        this.cdr.markForCheck();
      },
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      firstName:         ['', [Validators.required, Validators.minLength(2)]],
      lastName:          ['', [Validators.required, Validators.minLength(2)]],
      gender:            ['MALE', Validators.required],
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
      parentPassword:    ['', [Validators.required, Validators.minLength(8)]],
    });

    this.evaluateParentValidators();
  }

  setParentMode(mode: 'NONE' | 'NEW' | 'EXISTING'): void {
    this.parentMode = mode;
    this.parentSearchResults = [];
    this.parentSearchQuery = '';
    this.selectedParentId = null;

    this.form.patchValue({
      fatherName: '', motherName: '', emergencyContact: '',
      parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '', parentPassword: ''
    });

    this.evaluateParentValidators();
    this.cdr.markForCheck();
  }

  private evaluateParentValidators(): void {
    const parentFields = [
      'fatherName', 'motherName', 'emergencyContact',
      'parentFirstName', 'parentLastName', 'parentEmail', 'parentPhone'
    ];

    if (this.parentMode === 'NONE') {
      parentFields.forEach(f => this.form.get(f)?.clearValidators());
      this.form.get('parentPassword')?.clearValidators();
    } else if (this.parentMode === 'EXISTING') {
      parentFields.forEach(f => this.form.get(f)?.clearValidators());
      this.form.get('parentPassword')?.clearValidators();
    } else {
      parentFields.forEach(f => this.form.get(f)?.setValidators(f === 'emergencyContact' || f === 'parentPhone' ? [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)] : f === 'parentEmail' ? [Validators.required, Validators.email] : Validators.required));

      if (this.isEditMode) {
        this.form.get('parentPassword')?.clearValidators();
      } else {
        this.form.get('parentPassword')?.setValidators([Validators.required, Validators.minLength(8)]);
      }
    }

    parentFields.forEach(f => this.form.get(f)?.updateValueAndValidity());
    this.form.get('parentPassword')?.updateValueAndValidity();
  }

  onSearchParent(event?: Event): void {
    if (event) event.preventDefault();
    if (!this.parentSearchQuery.trim()) return;

    this.searchingParents = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.studentService.searchExistingParents({ name: this.parentSearchQuery.trim() }).subscribe({
      next: (data) => {
        this.parentSearchResults = data;
        this.searchingParents = false;
        if (data.length === 0) {
          this.errorMessage = 'No parents found matching that name.';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.searchingParents = false;
        this.errorMessage = 'Failed to fetch tracking parents registry logs.';
        this.cdr.markForCheck();
      }
    });
  }

  selectParent(parent: ParentSearchResultDto): void {
    this.selectedParentId = parent.id;

    this.form.patchValue({
      fatherName:        parent.fatherName || `${parent.firstName} ${parent.lastName}`,
      motherName:        parent.motherName || '',
      emergencyContact:  parent.emergencyContact || parent.phone,
      parentFirstName:   parent.firstName,
      parentLastName:    parent.lastName,
      parentEmail:       parent.email,
      parentPhone:       parent.phone,
      parentPassword:    ''
    });

    this.form.get('parentPassword')?.clearValidators();
    this.form.get('parentPassword')?.updateValueAndValidity();

    this.cdr.markForCheck();
  }

  loadClasses(): void {
    this.loadingClasses = true;
    this.studentService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.loadingClasses = false;
        this.classesReady = true;
        this.tryPatchEdit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClasses = false;
        this.errorMessage = 'Could not load classes from server.';
        this.classesReady = true;
        this.tryPatchEdit();
        this.cdr.markForCheck();
      },
    });
  }

  onClassChange(): void {
    const classId = this.form.get('classId')?.value;
    this.form.patchValue({ sectionId: '', academicSessionId: '' });
    this.sections = [];
    this.academicSessions = [];
    if (classId) {
      this.loadSections(classId);
      this.loadAcademicSessions(classId);
    }
  }

  loadAcademicSessions(classId: string): void {
    this.loadingAcademicSessions = true;
    this.studentService.getAcademicSessions(classId).subscribe({
      next: (data) => { this.academicSessions = data; this.loadingAcademicSessions = false; this.cdr.markForCheck(); },
      error: ()     => { this.loadingAcademicSessions = false; this.cdr.markForCheck(); },
    });
  }

  loadSections(classId: string): void {
    this.loadingSections = true;
    this.studentService.getSections(classId).subscribe({
      next: (data) => { this.sections = data; this.loadingSections = false; this.cdr.markForCheck(); },
      error: ()     => { this.loadingSections = false; this.cdr.markForCheck(); },
    });
  }

  // ✅ dono ready hone pe hi patch karo
  private tryPatchEdit(): void {
    if (this.isEditMode && this.classesReady && this.studentReady) {
      this.patchEditData();
    }
  }
private patchEditData(): void {
  const student = this.loadedStudent;
  if (!student) {
    this.errorMessage = this.errorMessage || 'Student data not found. Please go back to the list and try again.';
    this.cdr.markForCheck();
    return;
  }

  const formattedDob = student.dob ? student.dob.substring(0, 10) : '';
  const formattedAdmissionDate = student.admissionDate ? student.admissionDate.substring(0, 10) : '';

  // ✅ guardianName ko split karke parentFirstName/parentLastName me daalo
  const guardianParts = (student.guardianName || '').trim().split(' ');
  const guardianFirst = guardianParts[0] || '';
  const guardianLast  = guardianParts.slice(1).join(' ') || '';

  this.form.patchValue({
    firstName:         student.firstName,
    lastName:          student.lastName,
    gender:            student.gender ?? 'MALE',
    dob:               formattedDob,
    admissionDate:     formattedAdmissionDate,
    rollNo:            student.rollNo ?? '',
    classId:           student.classId ?? '',
    sectionId:         student.sectionId ?? '',
    academicSessionId: student.academicSessionId ?? '',
    fatherName:        student.fatherName ?? '',
    motherName:        student.motherName ?? '',
    emergencyContact:  student.emergencyContact ?? '',
    parentFirstName:   student.parentFirstName ?? guardianFirst,   // ✅ fallback to guardianName split
    parentLastName:    student.parentLastName ?? guardianLast,     // ✅ fallback
    parentEmail:       student.parentEmail ?? '',
    parentPhone:       student.parentPhone ?? student.emergencyContact ?? '',  // ✅ backend phone nahi bhej raha, emergencyContact hi use karo
  });

  this.form.get('parentPassword')?.clearValidators();
  this.form.get('parentPassword')?.updateValueAndValidity();

  if (student.classId) {
    this.loadSections(student.classId);
    this.loadAcademicSessions(student.classId);
  }
  this.cdr.markForCheck();
}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: any = { ...this.form.value };
    if (this.isEditMode && this.studentId) payload.studentId = this.studentId;

    if (this.parentMode === 'EXISTING' && this.selectedParentId) {
      payload.parentId = this.selectedParentId;
    }

    if (!payload.parentPassword) delete payload.parentPassword;

    this.studentService.saveStudent(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.successMessage = this.isEditMode ? 'Student updated successfully!' : 'Student added successfully!';
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['students', 'list']), 1200);
        } else {
          this.errorMessage = res.message || 'Something went wrong.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Failed to save student. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['students', 'list']);
  }

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
    if (c.errors['pattern'])   return 'Enter a valid phone number (e.g. +919876543210).';
    return 'Invalid value.';
  }
}