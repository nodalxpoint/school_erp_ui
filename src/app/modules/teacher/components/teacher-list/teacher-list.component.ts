import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { TeacherResponseDto, TeacherFilterRequest } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherListComponent implements OnInit {
  teachers: TeacherResponseDto[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;

  filter: TeacherFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'asc'
  };
  searchText = '';

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { 
    this.loadTeachers(); 
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.teacherService.filterTeachers({
      ...this.filter,
      firstName: this.searchText || undefined
    }).subscribe({
      next: (res: any) => {
        this.teachers = res?.data ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void { 
    this.filter.page = 0; 
    this.loadTeachers(); 
  }

  onPageChange(p: number): void { 
    this.filter.page = p; 
    this.loadTeachers(); 
  }

  // ✅ FIX: Navigates straight down to a new dedicated route page carrying data state matrix
  onView(t: TeacherResponseDto): void {
    this.router.navigate([`/teachers/${t.teacherId}`], {
      state: { teacher: t }
    });
  }

  onAddTeacher(): void {
    this.router.navigate(['/teachers/add']);
  }

  onEdit(t: TeacherResponseDto): void {
    this.router.navigate(['/teachers', t.teacherId, 'edit'], {
      state: { teacher: t }
    }); 
  }

  onDelete(t: TeacherResponseDto): void {
    const id = t.id ?? t.teacherId;
    if (!id) return;
    const name = this.teacherName(t);
    if (confirm(`Are you sure you want to delete the teacher "${name}"?`)) {
      this.isLoading = true;
      this.teacherService.deleteTeacher(id).subscribe({
        next: () => {
          this.loadTeachers();
        },
        error: (err) => {
          this.isLoading = false;
          alert(err?.error?.message || 'Failed to delete teacher.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  get safeTeachers(): TeacherResponseDto[] { return this.teachers ?? []; }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get currentPage(): number { return this.filter.page; }

  teacherName(t: TeacherResponseDto): string {
    return t.lastName ? `${t.firstName} ${t.lastName}` : t.firstName;
  }

  initials(t: TeacherResponseDto): string {
    const f = t.firstName?.[0] ?? '';
    const l = t.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  trackById(_: number, t: TeacherResponseDto): string {
    return t.id ?? t.teacherId ?? '';
  }
}