import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { StudentService } from '../../services/student.service';
import { AcademicSessionService } from '../../../academic/services/academic-session.service';
import {
  CreateStudentRequest,
  StudentResponseDto,
} from '../../models/student.model';
import { AcademicSessionResponseDto } from '../../../academic/models/academic-session.model';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentFormComponent implements OnInit, OnDestroy {

  @Input() set editStudent(student: StudentResponseDto | null) {
    if (student) {
      this._prefillStudent(student);
    }
  }

  @Output() studentSaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  studentForm!: FormGroup;
  sessions: AcademicSessionResponseDto[] = [];
  isLoadingSessions = false;
  isSubmitting = false;
  isEditMode = false;
  editStudentId = '';

  toast: ToastState = { visible: false, type: 'success', message: '' };
  private toastTimer?: ReturnType<typeof setTimeout>;
  private destroy$ = new Subject<void>();

  readonly genders = ['MALE', 'FEMALE', 'OTHER'];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private sessionService: AcademicSessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._buildForm();
    this._loadSessions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private _buildForm(): void {
    this.studentForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      gender: [''],
      dob: [''],
      admissionDate: [''],
      classId: [''],
      sectionId: [''],
      academicSessionId: [''],
      rollNo: [''],
      fatherName: [''],
      motherName: [''],
      emergencyContact: [''],
      parentFirstName: [''],
      parentLastName: [''],
      parentEmail: [''],
      parentPhone: [''],
      parentPassword: [''],
    });
  }

  private _loadSessions(): void {
    this.isLoadingSessions = true;
    this.sessionService
      .listSessions({ page: 0, size: 100, sortBy: 'createdAt', sortDirection: 'DESC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.sessions = res?.data ?? [];
          this.isLoadingSessions = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingSessions = false;
          this.cdr.markForCheck();
        },
      });
  }

  private _prefillStudent(student: StudentResponseDto): void {
    // StudentResponseDto only has: id, firstName, lastName, admissionNo
    // Only prefill what backend actually returns
    this.isEditMode = true;
    this.editStudentId = student.id ?? '';

    if (this.studentForm) {
      this.studentForm.patchValue({
        firstName: student.firstName,
        lastName: student.lastName,
      });
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    const v = this.studentForm.value;

    const payload: CreateStudentRequest = {
      firstName: v.firstName?.trim(),
      lastName: v.lastName?.trim(),
      gender: v.gender,
      dob: v.dob,
      admissionDate: v.admissionDate,
      classId: v.classId?.trim(),
      sectionId: v.sectionId?.trim(),
      academicSessionId: v.academicSessionId,
      rollNo: v.rollNo?.trim(),
      fatherName: v.fatherName?.trim(),
      motherName: v.motherName?.trim(),
      emergencyContact: v.emergencyContact?.trim(),
      parentFirstName: v.parentFirstName?.trim(),
      parentLastName: v.parentLastName?.trim(),
      parentEmail: v.parentEmail?.trim(),
      parentPhone: v.parentPhone?.trim(),
      parentPassword: v.parentPassword,
      ...(this.isEditMode && this.editStudentId ? { studentId: this.editStudentId } : {}),
    };

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.studentService
      .saveStudent(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.showToast('success', res?.message ?? 'Student saved successfully!');
          this.studentSaved.emit();
          this._resetForm();
        },
        error: (err) => {
          this.showToast('error', err?.error?.message ?? 'Failed to save student.');
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  onCancel(): void {
    this._resetForm();
    this.cancelled.emit();
  }

  private _resetForm(): void {
    this.isSubmitting = false;
    this.isEditMode = false;
    this.editStudentId = '';
    this.studentForm.reset();
    this.cdr.markForCheck();
  }

  showToast(type: 'success' | 'error', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, message };
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.markForCheck();
    }, 4000);
  }
}