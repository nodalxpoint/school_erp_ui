import {
  Component, EventEmitter, Input, OnInit,
  Output, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AssignClassTeacherDto,
  AssignTeacherFormState,
} from '../../models/teacher.model';
import { TeacherService, ParamDropdownOption } from '../../services/teacher.service';

@Component({
  selector: 'app-assign-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-teacher.component.html',
  styleUrls: ['./assign-teacher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignTeacherComponent implements OnInit {
  @Input() schoolId: string = '';
  @Output() assigned = new EventEmitter<void>();

  // ── Dropdown data ─────────────────────────────────────────────────────────
  classes:          ParamDropdownOption[] = [];
  sections:         ParamDropdownOption[] = [];   // class select hone ke baad
  teachers:         ParamDropdownOption[] = [];   // class select hone ke baad
  academicSessions: ParamDropdownOption[] = [];   // class select hone ke baad

  // ── Loading states ────────────────────────────────────────────────────────
  loadingClasses  = false;
  loadingSections = false;
  loadingTeachers = false;
  loadingSessions = false;

  form: AssignTeacherFormState = {
    classId: '', sectionId: '', teacherId: '', academicSessionId: ''
  };
  errors: Partial<AssignTeacherFormState> = {};
  isSubmitting = false;

  constructor(
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ✅ Sirf classes load hongi — baaki sab lazy (class select pe)
    this.loadClasses();
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  loadClasses(): void {
    this.loadingClasses = true;
    this.teacherService.getClassOptions().subscribe({
      next: data => {
        this.classes        = data;
        this.loadingClasses = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClasses = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadSections(classId: string): void {
    this.loadingSections = true;
    this.sections        = [];
    this.teacherService.getSectionOptions(classId).subscribe({
      next: data => {
        this.sections        = data;
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSections = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTeachers(): void {
    this.loadingTeachers = true;
    this.teachers        = [];
    this.teacherService.getTeacherOptions().subscribe({
      next: data => {
        this.teachers        = data;
        this.loadingTeachers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingTeachers = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAcademicSessions(): void {
    this.loadingSessions  = true;
    this.academicSessions = [];
    this.teacherService.getAcademicSessionOptions().subscribe({
      next: data => {
        this.academicSessions = data;
        this.loadingSessions  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSessions = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Class change → sections + teachers + sessions lazy load ───────────────

  onClassChange(): void {
    // Reset dependent fields
    this.form.sectionId        = '';
    this.form.teacherId        = '';
    this.form.academicSessionId = '';
    this.sections              = [];
    this.teachers              = [];
    this.academicSessions      = [];

    if (!this.form.classId) {
      this.cdr.markForCheck();
      return;
    }

    // ✅ Ab teeno ek saath load honge — lekin sirf class select ke BAAD
    this.loadSections(this.form.classId);
    this.loadTeachers();
    this.loadAcademicSessions();
    this.cdr.markForCheck();
  }

  // ── Validation & Submit ───────────────────────────────────────────────────

  validate(): boolean {
    this.errors = {};
    if (!this.form.classId)            this.errors.classId = 'Required';
    if (!this.form.sectionId)          this.errors.sectionId = 'Required';
    if (!this.form.teacherId)          this.errors.teacherId = 'Required';
    if (!this.form.academicSessionId)  this.errors.academicSessionId = 'Required';
    return !Object.keys(this.errors).length;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.isSubmitting = true;

    const dto: AssignClassTeacherDto = { ...this.form };
    this.teacherService.assignClassTeacher(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.assigned.emit();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  resetForm(): void {
    this.form             = { classId: '', sectionId: '', teacherId: '', academicSessionId: '' };
    this.errors           = {};
    this.sections         = [];
    this.teachers         = [];
    this.academicSessions = [];
  }
}