import {
  Component, EventEmitter, Input, OnInit,
  Output, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AssignClassTeacherDto, AssignTeacherFormState,
  ClassTeacherAssignmentFilterRequest, ClassTeacherAssignmentResponseDto,
  PagedResponse, TeacherFilterRequest, TeacherResponseDto
} from '../../models/teacher.model';
import { TeacherService } from '../../services/teacher.service';
import { ClassService } from '../../../class/services/class.service';
import { AcademicSessionService } from '../../../academic/services/academic-session.service';

export interface DropdownOption { id: string; name: string; }

// Section dropdown — classId ke saath taaki filter ho sake
export interface SectionOption { id: string; name: string; classId: string; }

@Component({
  selector: 'app-assign-teacher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-teacher.component.html',
  styleUrls: ['./assign-teacher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignTeacherComponent implements OnInit {
  // schoolId parent se aayega (auth store / route se jo bhi use ho raha hai)
  @Input() schoolId: string = '';
  @Output() assigned = new EventEmitter<void>();

  // Dropdown data
  teachers: TeacherResponseDto[]     = [];
  classes: DropdownOption[]          = [];
  allSections: SectionOption[]       = [];   // sab sections store
  filteredSections: SectionOption[]  = []; 
  academicSessions: DropdownOption[] = [];

  form: AssignTeacherFormState = {
    classId: '', sectionId: '', teacherId: '', academicSessionId: ''
  };
  errors: Partial<AssignTeacherFormState> = {};
  isSubmitting = false;

  // Assigned list
  assignments: ClassTeacherAssignmentResponseDto[] = [];
  isLoadingList = false;
  totalPages    = 0;
  totalElements = 0;
  filter: ClassTeacherAssignmentFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'desc'
  };
  filterTeacherName = '';

  constructor(
    private teacherService: TeacherService,
    private classService: ClassService,
    private academicSessionService: AcademicSessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClasses();
    this.loadAcademicSessions();
    this.loadAssignments();
  }

  // ── Loaders ────────────────────────────────────────────────────────────────

loadTeachers(): void {
  const req: TeacherFilterRequest = {
    page: 0, size: 100, sortBy: 'createdAt', sortDirection: 'asc'
  };
  this.teacherService.filterTeachers(req).subscribe({
    next: res => {
      this.teachers = res.data.map((t: any) => ({
        ...t,
        id: t.teacherId ?? t.id ?? t.userId   // ← teacherId first
      }));
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('loadTeachers error:', err);
      this.cdr.markForCheck();
    }
  });
}


loadClasses(): void {
  this.classService.getAllClasses(this.schoolId).subscribe({
    next: (classesDto) => {
        this.classes = classesDto.map(c => ({
        id: c.id,      
        name: c.className
      }));

      this.allSections = classesDto.flatMap(c =>
        (c.sections ?? []).map((s: any) => ({
          id:      s.sectionId,
          name:    s.sectionName,
          classId: c.id    
        }))
      );
      this.cdr.markForCheck();
    }
  });
}

  loadAcademicSessions(): void {
    this.academicSessionService.getActiveSessionOptions(this.schoolId || undefined).subscribe({
      next: sessions => {
        this.academicSessions = sessions;
        this.cdr.markForCheck();
      }
    });
  }

  loadAssignments(): void {
    this.isLoadingList = true;
    this.teacherService.filterClassTeacherAssignments({
      ...this.filter,
      teacherName: this.filterTeacherName || undefined
    }).subscribe({
      next: (res: PagedResponse<ClassTeacherAssignmentResponseDto>) => {
        this.assignments   = res.data;
        this.totalPages    = res.totalPages;
        this.totalElements = res.totalElements;
        this.isLoadingList = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingList = false; this.cdr.markForCheck(); }
    });
  }

  // ── Class change → section filter ─────────────────────────────────────────

  onClassChange(): void {
    this.form.sectionId    = '';   // reset section
    this.filteredSections  = this.allSections.filter(s => s.classId === this.form.classId);
    this.cdr.markForCheck();
  }

  // ── Validation & Submit ────────────────────────────────────────────────────

  validate(): boolean {
    this.errors = {};
    if (!this.form.classId)           this.errors.classId = 'Required';
    if (!this.form.sectionId)         this.errors.sectionId = 'Required';
    if (!this.form.teacherId)         this.errors.teacherId = 'Required';
    if (!this.form.academicSessionId) this.errors.academicSessionId = 'Required';
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
        this.loadAssignments();
        this.assigned.emit();
        this.cdr.markForCheck();
      },
      error: () => { this.isSubmitting = false; this.cdr.markForCheck(); }
    });
  }

  // ── Pagination & Filter ───────────────────────────────────────────────────

  applyFilter(): void {
    this.filter.page = 0;
    this.loadAssignments();
  }

  changePage(p: number): void {
    this.filter.page = p;
    this.loadAssignments();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  teacherName(t: TeacherResponseDto): string {
    return t.lastName ? `${t.firstName} ${t.lastName}` : t.firstName;
  }

  resetForm(): void {
    this.form             = { classId: '', sectionId: '', teacherId: '', academicSessionId: '' };
    this.errors           = {};
    this.filteredSections = [];
  }
}