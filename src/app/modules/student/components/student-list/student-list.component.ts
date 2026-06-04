import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { StudentService } from '../../services/student.service';
import {
  StudentResponseDto,
  StudentFilterRequest,
} from '../../models/student.model';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListComponent implements OnInit, OnDestroy {
  @Output() editStudentClicked = new EventEmitter<StudentResponseDto>();

  students: StudentResponseDto[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = false;
  error: string | null = null;

  filterForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private studentService: StudentService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      admissionNo: [''],
      classId: [''],
      sectionId: [''],
    });

    this.loadStudents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.error = null;

    const formVal = this.filterForm.value;

    const request: StudentFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      // Only include non-empty filters
      ...(formVal.firstName   && { firstName:   formVal.firstName }),
      ...(formVal.lastName    && { lastName:    formVal.lastName }),
      ...(formVal.admissionNo && { admissionNo: formVal.admissionNo }),
      ...(formVal.classId     && { classId:     formVal.classId }),
      ...(formVal.sectionId   && { sectionId:   formVal.sectionId }),
    };

    this.studentService
      .filterStudents(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.students = res.data ?? [];
          this.totalElements = res.totalElements ?? 0;
          this.totalPages = res.totalPages ?? 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to load students.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadStudents();
  }

  resetFilter(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadStudents();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStudents();
  }

  onEditStudent(student: StudentResponseDto): void {
    this.editStudentClicked.emit(student);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  fullName(s: StudentResponseDto): string {
    return `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
  }
}