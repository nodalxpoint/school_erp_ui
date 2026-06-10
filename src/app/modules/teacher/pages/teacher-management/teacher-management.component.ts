import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TeacherFormComponent } from '../../components/teacher-form/teacher-form.component';
import { TeacherListComponent } from '../../components/teacher-list/teacher-list.component';
import { TeacherDetailComponent } from '../../components/teacher-detail/teacher-detail.component';
import { AssignTeacherComponent } from '../../components/assign-teacher/assign-teacher.component';
import { TeacherService } from '../../services/teacher.service';
import { ClassService } from '../../../class/services/class.service';
import { AcademicSessionService } from '../../../academic/services/academic-session.service';
import {
  CreateTeacherDto, TeacherFilterRequest, TeacherResponseDto
} from '../../models/teacher.model';

type Tab = 'list' | 'add' | 'assign';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TeacherFormComponent, TeacherListComponent,
    TeacherDetailComponent, AssignTeacherComponent
  ],
  templateUrl: './teacher-management.component.html',
  styleUrls: ['./teacher-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherManagementComponent implements OnInit {

  activeTab: Tab = 'list';

  // ← apna actual schoolId yahan set karo (auth store se)
  schoolId = '';

  // List state
  teachers: TeacherResponseDto[] = [];
  isLoading     = false;
  isSubmitting  = false;
  totalElements = 0;
  totalPages    = 0;

  filter: TeacherFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'asc'
  };
  searchText = '';

  // Edit / detail state
  editTeacher:   TeacherResponseDto | null = null;
  detailTeacher: TeacherResponseDto | null = null;

  // Assign tab dropdown data
  classes:          { id: string; name: string }[] = [];
  sections:         { id: string; name: string; classId: string }[] = [];
  academicSessions: { id: string; name: string }[] = [];

  // Toast
  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private teacherService: TeacherService,
    private classService: ClassService,
    private academicSessionService: AcademicSessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadAssignData();
  }

  // ── Load teachers ─────────────────────────────────────────────────────────

  loadTeachers(): void {
    this.isLoading = true;
    this.teacherService.filterTeachers({
      ...this.filter,
      search: this.searchText || undefined
    }).subscribe({
      next: (res: any) => {
        this.teachers      = res?.data          ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages    = res?.totalPages    ?? 0;
        this.isLoading     = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('loadTeachers error:', err);
        this.isLoading = false;
        this.showToast('Failed to load teachers', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Load assign tab data (classes + sessions in parallel) ─────────────────

  loadAssignData(): void {
    forkJoin({
      classes:  this.classService.getAllClasses(this.schoolId),
      sessions: this.academicSessionService.getActiveSessionOptions(this.schoolId)
    }).subscribe({
      next: ({ classes, sessions }) => {
        // classes: ClassesDto[] → { id, className, sections[] }
        this.classes = classes.map(c => ({ id: c.id, name: c.className }));

        // sections: flatten all sections from every class
        this.sections = classes.flatMap(c =>
          (c.sections ?? []).map((s: any) => ({
            id:      s.sectionId ?? s.id,
            name:    s.sectionName ?? s.name,
            classId: c.id
          }))
        );

        this.academicSessions = sessions;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('loadAssignData error:', err);
        this.showToast('Failed to load classes/sessions', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearch(): void {
    this.filter.page = 0;
    this.loadTeachers();
  }

  onPageChange(p: number): void {
    this.filter.page = p;
    this.loadTeachers();
  }

  // ── Form submit ───────────────────────────────────────────────────────────

  onFormSubmit(dto: CreateTeacherDto): void {
    this.isSubmitting = true;
    this.teacherService.addOrUpdateTeacher(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.editTeacher  = null;
        this.activeTab    = 'list';
        this.showToast(
          dto.userId ? 'Teacher updated successfully' : 'Teacher created successfully',
          'success'
        );
        this.loadTeachers();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.showToast('Operation failed', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onEditTeacher(t: TeacherResponseDto): void {
    this.editTeacher   = t;
    this.detailTeacher = null;
    this.activeTab     = 'add';
  }

  onCancelEdit(): void {
    this.editTeacher = null;
    this.activeTab   = 'list';
  }

  onDetailClose(): void { this.detailTeacher = null; }

  onAssigned(): void {
    this.showToast('Teacher assigned successfully', 'success');
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab   = tab;
    this.editTeacher = null;
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, 3500);
  }
}