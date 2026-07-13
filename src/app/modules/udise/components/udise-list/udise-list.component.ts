// src/app/modules/udise/components/udise-list/udise-list.component.ts

import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UdiseService } from '../../services/udise.service';
import { StudentService } from '../../../student/services/student.service';
import { StudentUdiseModalComponent } from '../../../student/components/student-udise-modal/student-udise-modal.component';
import { StudentUdiseResponseDto, StudentUdiseFilterRequest } from '../../models/udise.model';
import { DropdownOption, StudentResponseDto } from '../../../student/models/student.model';

@Component({
  selector: 'app-udise-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentUdiseModalComponent],
  templateUrl: './udise-list.component.html',
  styleUrls: ['./udise-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UdiseListComponent implements OnInit {
  records: StudentUdiseResponseDto[] = [];
  loading = false;
  error = '';

  // Filter params
  searchPen = '';
  selectedStatus = '';
  selectedAcademicSessionId = '';
  academicSessions: DropdownOption[] = [];
  loadingSessions = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Modal control
  selectedUdiseId: string | null = null;
  selectedStudent: StudentResponseDto | null = null;
  showModal = false;

  // Student search for creating new records
  showStudentSearch = false;
  studentSearchQuery = '';
  searchedStudents: StudentResponseDto[] = [];
  loadingStudentsSearch = false;

  constructor(
    private udiseService: UdiseService,
    private studentService: StudentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAcademicSessions();
    this.loadUdiseRecords();
  }

  loadAcademicSessions(): void {
    this.loadingSessions = true;
    this.studentService.getAcademicSessions().subscribe({
      next: (data) => {
        this.academicSessions = data;
        this.loadingSessions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSessions = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadUdiseRecords(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const req: StudentUdiseFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      pen: this.searchPen.trim() || undefined,
      udiseStatus: this.selectedStatus || undefined,
      academicSessionId: this.selectedAcademicSessionId || undefined
    };

    this.udiseService.filterUdise(req).subscribe({
      next: (res) => {
        this.records = res.data;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching UDISE records:', err);
        this.error = 'Failed to load UDISE records. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadUdiseRecords();
  }

  clearFilters(): void {
    this.searchPen = '';
    this.selectedStatus = '';
    this.selectedAcademicSessionId = '';
    this.currentPage = 0;
    this.loadUdiseRecords();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchPen || this.selectedStatus || this.selectedAcademicSessionId);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadUdiseRecords();
  }

  // ── Modal Actions ────────────────────────────────────────────────

  onEditRecord(rec: StudentUdiseResponseDto): void {
    this.selectedUdiseId = rec.id;
    this.selectedStudent = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  onOpenAddUdiseFlow(): void {
    this.showStudentSearch = true;
    this.studentSearchQuery = '';
    this.searchedStudents = [];
    this.cdr.markForCheck();
  }

  onCloseStudentSearch(): void {
    this.showStudentSearch = false;
    this.cdr.markForCheck();
  }

  searchStudents(): void {
    if (!this.studentSearchQuery.trim()) {
      this.searchedStudents = [];
      return;
    }

    this.loadingStudentsSearch = true;
    this.cdr.markForCheck();

    // Use StudentService to find students by name / admission number
    this.studentService.filterStudents({
      page: 0,
      size: 5,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      firstName: this.studentSearchQuery.trim()
    }).subscribe({
      next: (res) => {
        this.searchedStudents = res.data;
        this.loadingStudentsSearch = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error searching students:', err);
        this.loadingStudentsSearch = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSelectStudentForUdise(student: StudentResponseDto): void {
    this.selectedStudent = student;
    this.selectedUdiseId = null;
    this.showStudentSearch = false;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  onCloseModal(): void {
    this.showModal = false;
    this.selectedUdiseId = null;
    this.selectedStudent = null;
    this.cdr.markForCheck();
  }

  onRecordSaved(): void {
    this.loadUdiseRecords();
  }

  // Pagination helpers
  get pages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    let start = Math.max(0, cur - 2);
    let end = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startIndex(): number { return this.currentPage * this.pageSize + 1; }
  get endIndex(): number { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
}
