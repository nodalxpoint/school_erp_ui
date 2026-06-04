import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import {
  TeacherResponseDto,
  TeacherFilterRequest,
  PagedResponse,
} from '../../models/teacher.model';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherListComponent implements OnInit {
  teachers: TeacherResponseDto[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = false;
  error: string | null = null;

  filterForm!: FormGroup;

  constructor(
    private teacherService: TeacherService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      employeeCode: [''],
      qualification: [''],
    });

    this.loadTeachers();
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.error = null;

    const request: TeacherFilterRequest = {
      ...this.filterForm.value,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
    };

    this.teacherService.filterTeachers(request).subscribe({
      next: (res: PagedResponse<TeacherResponseDto>) => {
        this.teachers = res.data;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to load teachers.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadTeachers();
  }

  resetFilter(): void {
    this.filterForm.reset({ employeeCode: '', qualification: '' });
    this.currentPage = 0;
    this.loadTeachers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTeachers();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  fullName(t: TeacherResponseDto): string {
    return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim();
  }
}