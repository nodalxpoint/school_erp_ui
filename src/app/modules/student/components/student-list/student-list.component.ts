import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService, StudentStateService } from '../../services/student.service';
import { StudentResponseDto, StudentFilterRequest, DropdownOption } from '../../models/student.model';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListComponent implements OnInit {
  students: StudentResponseDto[] = [];
  loading = false;
  error = '';

  // Filters
  searchFirstName = '';
  searchLastName = '';
  searchAdmissionNo = '';
  selectedClassId = '';
  selectedSectionId = '';

  // Dropdowns
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  loadingClasses = false;
  loadingSections = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private studentService: StudentService,
    private studentState: StudentStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadStudents();
  }

  // ── Dropdowns ──────────────────────────────────────────────────

  loadClasses(): void {
    this.loadingClasses = true;
    this.studentService.getClasses().subscribe({
      next: (data) => { this.classes = data; this.loadingClasses = false; this.cdr.markForCheck(); },
      error: ()     => { this.loadingClasses = false; this.cdr.markForCheck(); },
    });
  }

  onClassFilterChange(): void {
    this.selectedSectionId = '';
    this.sections = [];
    if (this.selectedClassId) {
      this.loadingSections = true;
      this.studentService.getSections(this.selectedClassId).subscribe({
        next: (data) => { this.sections = data; this.loadingSections = false; this.cdr.markForCheck(); },
        error: ()     => { this.loadingSections = false; this.cdr.markForCheck(); },
      });
    }
    this.onSearch();
  }

  // ── Students ───────────────────────────────────────────────────

  loadStudents(): void {
    this.loading = true;
    this.error = '';

    const req: StudentFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      firstName:   this.searchFirstName.trim()   || undefined,
      lastName:    this.searchLastName.trim()     || undefined,
      admissionNo: this.searchAdmissionNo.trim()  || undefined,
      classId:     this.selectedClassId           || undefined,
      sectionId:   this.selectedSectionId         || undefined,
    };

    this.studentService.filterStudents(req).subscribe({
      next: (res) => {
        this.students      = res.data;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.loading       = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Failed to load students. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadStudents();
  }

  clearFilters(): void {
    this.searchFirstName  = '';
    this.searchLastName   = '';
    this.searchAdmissionNo = '';
    this.selectedClassId  = '';
    this.selectedSectionId = '';
    this.sections          = [];
    this.currentPage       = 0;
    this.loadStudents();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchFirstName || this.searchLastName ||
              this.searchAdmissionNo || this.selectedClassId || this.selectedSectionId);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadStudents();
  }

  // ── Navigation ─────────────────────────────────────────────────

  onAddStudent(): void {
    this.studentState.clear();
    this.router.navigate(['students', 'add']);
  }

  // Edit Button Click
onEditStudent(student: any) {
  this.router.navigate(['/students/edit', student.id]); 
}

onViewStudent(student: any) {
  this.router.navigate(['/students/detail', student.id]);
}

  // ── Pagination helpers ─────────────────────────────────────────

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    let start   = Math.max(0, cur - 2);
    let end     = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else             start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get startIndex(): number { return this.currentPage * this.pageSize + 1; }
  get endIndex(): number   { return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements); }
}
