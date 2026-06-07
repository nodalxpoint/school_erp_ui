import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeacherService, TeacherStateService } from '../../services/teacher.service';
import { TeacherResponseDto, TeacherFilterRequest } from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherListComponent implements OnInit {
  teachers: TeacherResponseDto[] = [];
  loading = false;
  error = '';

  // Column filters
  searchFirstName  = '';
  searchLastName   = '';
  searchEmail      = '';
  searchEmpCode    = '';

  // Pagination
  currentPage   = 0;
  pageSize      = 10;
  totalElements = 0;
  totalPages    = 0;

  constructor(
    private teacherService: TeacherService,
    private teacherState: TeacherStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.loadTeachers(); }

  loadTeachers(): void {
    this.loading = true;
    this.error   = '';

    const req: TeacherFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      firstName:    this.searchFirstName.trim()  || undefined,
      lastName:     this.searchLastName.trim()   || undefined,
      email:        this.searchEmail.trim()      || undefined,
      employeeCode: this.searchEmpCode.trim()    || undefined,
    };

    this.teacherService.filterTeachers(req).subscribe({
      next: (res) => {
        this.teachers      = res.data;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.loading       = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Failed to load teachers. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearch(): void { this.currentPage = 0; this.loadTeachers(); }

  clearFilters(): void {
    this.searchFirstName = '';
    this.searchLastName  = '';
    this.searchEmail     = '';
    this.searchEmpCode   = '';
    this.currentPage     = 0;
    this.loadTeachers();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchFirstName || this.searchLastName ||
              this.searchEmail     || this.searchEmpCode);
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p;
    this.loadTeachers();
  }

  onAdd(): void {
    this.teacherState.clear();
    this.router.navigate(['teachers', 'add']);
  }

  onView(t: TeacherResponseDto): void {
    this.teacherState.set(t);
    this.router.navigate(['teachers', 'detail', t.teacherId ?? t.id]);
  }

  onEdit(t: TeacherResponseDto): void {
    this.teacherState.set(t);
    this.router.navigate(['teachers', 'edit', t.teacherId ?? t.id]);
  }

  get pages(): number[] {
    const total = this.totalPages, cur = this.currentPage;
    let start = Math.max(0, cur - 2), end = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else             start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startIndex(): number { return this.currentPage * this.pageSize + 1; }
  get endIndex(): number   { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }

  initials(t: TeacherResponseDto): string {
    return (t.firstName?.charAt(0) ?? '') + (t.lastName?.charAt(0) ?? '');
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  }
}
