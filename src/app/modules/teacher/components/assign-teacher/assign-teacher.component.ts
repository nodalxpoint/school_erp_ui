import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TeacherService } from '../../services/teacher.service';
import { AcademicSessionService } from '../../../academic/services/academic-session.service';
import {
  TeacherResponseDto,
  TeacherFilterRequest,
  AssignClassTeacherRequest,
} from '../../models/teacher.model';
import { AcademicSessionResponseDto } from '../../../academic/models/academic-session.model';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-assign-teacher',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './assign-teacher.component.html',
  styleUrls: ['./assign-teacher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignTeacherComponent implements OnInit, OnDestroy {
  assignForm!: FormGroup;

  // Dropdown data — teachers & sessions come from real APIs
  teachers: TeacherResponseDto[] = [];
  sessions: AcademicSessionResponseDto[] = [];

  // Class & Section — manual text inputs until GET APIs are built
  // TODO: replace with dropdowns when GET /api/school/classAndSection/list exists
  classIdManual = '';
  sectionIdManual = '';

  isLoading = false;
  isSubmitting = false;

  // Teacher searchable dropdown state
  teacherSearch = '';
  showTeacherDropdown = false;
  selectedTeacherLabel = '';
  selectedTeacherId = '';

  toast: ToastState = { visible: false, type: 'success', message: '' };
  private toastTimer?: ReturnType<typeof setTimeout>;
  private destroy$ = new Subject<void>();

  get filteredTeachers(): TeacherResponseDto[] {
    const q = this.teacherSearch.toLowerCase();
    if (!q) return this.teachers;
    return this.teachers.filter(
      (t) =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.employeeCode?.toLowerCase().includes(q)
    );
  }

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private sessionService: AcademicSessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.assignForm = this.fb.group({
      classId: [''],
      sectionId: [''],
      academicSessionId: [''],
    });

    this._loadDropdownData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ─── Load dropdown data (teachers + sessions) ─────────────────

  private _loadDropdownData(): void {
    this.isLoading = true;

    const teacherReq: TeacherFilterRequest = {
      page: 0,
      size: 200,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    };

    const sessionReq = {
      page: 0,
      size: 100,
      sortBy: 'createdAt',
      sortDirection: 'DESC' as const,
    };

    forkJoin({
      teachers: this.teacherService.filterTeachers(teacherReq),
      sessions: this.sessionService.listSessions(sessionReq),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ teachers, sessions }) => {
          this.teachers = teachers?.data ?? [];
          this.sessions = sessions?.data ?? [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.showToast('error', 'Failed to load form data. Please refresh.');
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ─── Teacher searchable dropdown ──────────────────────────────

  onTeacherSearchInput(event: Event): void {
    this.teacherSearch = (event.target as HTMLInputElement).value;
    this.selectedTeacherId = '';
    this.selectedTeacherLabel = '';
    this.cdr.markForCheck();
  }

  selectTeacher(teacher: TeacherResponseDto & { id?: string }): void {
    // NOTE: TeacherResponseDto doesn't expose id — this will be fixed
    // once backend adds id to the response DTO.
    // For now we store what we have; the assign call needs the real UUID.
    // TODO: ask backend to include `id` field in TeacherResponseDto
    this.selectedTeacherId = (teacher as any).id ?? '';
    this.selectedTeacherLabel = `${teacher.firstName} ${teacher.lastName} (${teacher.employeeCode})`;
    this.teacherSearch = this.selectedTeacherLabel;
    this.showTeacherDropdown = false;
    this.cdr.markForCheck();
  }

  onTeacherFocus(): void {
    this.showTeacherDropdown = true;
    this.teacherSearch = '';
    this.cdr.markForCheck();
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherDropdown = false;
      if (!this.selectedTeacherId) {
        this.teacherSearch = '';
        this.selectedTeacherLabel = '';
      } else {
        this.teacherSearch = this.selectedTeacherLabel;
      }
      this.cdr.markForCheck();
    }, 200);
  }

  // ─── Submit ───────────────────────────────────────────────────

  onSubmit(): void {
    const classId = this.assignForm.get('classId')?.value?.trim();
    const sectionId = this.assignForm.get('sectionId')?.value?.trim();
    const academicSessionId = this.assignForm.get('academicSessionId')?.value;

    if (!this.selectedTeacherId || !classId || !sectionId || !academicSessionId) {
      this.showToast('error', 'Please fill all fields before submitting.');
      return;
    }

    const payload: AssignClassTeacherRequest = {
      teacherId: this.selectedTeacherId,
      classId,
      sectionId,
      academicSessionId,
    };

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.teacherService.assignClassTeacher(payload).subscribe({
      next: (res) => {
        this.showToast('success', res?.message ?? 'Teacher assigned successfully!');
        this._resetForm();
      },
      error: (err) => {
        this.showToast('error', err?.error?.message ?? 'Assignment failed. Please try again.');
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  private _resetForm(): void {
    this.assignForm.reset();
    this.selectedTeacherId = '';
    this.selectedTeacherLabel = '';
    this.teacherSearch = '';
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }

  // ─── Toast ────────────────────────────────────────────────────

  showToast(type: 'success' | 'error', message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, message };
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.markForCheck();
    }, 4000);
  }

  fullName(t: TeacherResponseDto): string {
    return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim();
  }
}