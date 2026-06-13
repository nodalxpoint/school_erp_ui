import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { TeacherResponseDto, TeacherFilterRequest } from '../../models/teacher.model';
import { TeacherDetailComponent } from '../teacher-detail/teacher-detail.component';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TeacherDetailComponent],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherListComponent implements OnInit {

  teachers: TeacherResponseDto[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;
  selectedTeacher: TeacherResponseDto | null = null;   // detail panel

  filter: TeacherFilterRequest = {
    page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'asc'
  };
  searchText = '';

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { this.loadTeachers(); }

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

  onSearch(): void { this.filter.page = 0; this.loadTeachers(); }
  onPageChange(p: number): void { this.filter.page = p; this.loadTeachers(); }

  onView(t: TeacherResponseDto): void {
    const currentId = this.selectedTeacher?.teacherId;
    this.selectedTeacher = currentId === t.teacherId ? null : t;
    this.cdr.markForCheck(); // ← yeh add karo
  }

  onAddTeacher(): void {
    this.router.navigate(['/teachers/add']);
  }

  onDetailClose(): void {
    this.selectedTeacher = null;
    this.cdr.markForCheck(); // ← yeh bhi
  }

  onEdit(t: TeacherResponseDto): void {
    this.router.navigate(['/teachers', t.teacherId, 'edit']); // id hata, teacherId use karo
  }

  onDetailEdit(t: TeacherResponseDto): void {
    this.selectedTeacher = null;
    this.router.navigate(['/teachers', t.teacherId, 'edit']); // yahan bhi
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