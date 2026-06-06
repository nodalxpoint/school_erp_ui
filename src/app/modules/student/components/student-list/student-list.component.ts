import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService, StudentStateService } from '../../services/student.service';
import {
  StudentResponseDto,
  StudentFilterRequest,
  DropdownOption,
} from '../../models/student.model';

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

  // Column filters
  searchFirstName = '';
  searchLastName = '';
  searchAdmissionNo = '';
  selectedClassId = '';
  selectedSectionId = '';

  // Dropdown options from params API
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadStudents();
  }

  // ─── Params API calls ───────────────────────────────────────────

  loadClasses(): void {
    this.loadingClasses = true;
    this.studentService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.loadingClasses = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingClasses = false;
        this.cdr.markForCheck();
      },
    });
  }

  onClassFilterChange(): void {
    this.selectedSectionId = '';
    this.sections = [];
    if (this.selectedClassId) {
      this.loadSections(this.selectedClassId);
    }
    this.onSearch();
  }

  loadSections(classId: string): void {
    this.loadingSections = true;
    this.studentService.getSections(classId).subscribe({
      next: (data) => {
        this.sections = data;
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSections = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Student list ───────────────────────────────────────────────

  loadStudents(): void {
    this.loading = true;
    this.error = '';

    const request: StudentFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC',
      firstName: this.searchFirstName.trim() || undefined,
      lastName: this.searchLastName.trim() || undefined,
      admissionNo: this.searchAdmissionNo.trim() || undefined,
      classId: this.selectedClassId || undefined,
      sectionId: this.selectedSectionId || undefined,
    };

    this.studentService.filterStudents(request).subscribe({
      next: (res) => {
        this.students = res.data;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadStudents();
  }

  clearSearch(): void {
    this.searchFirstName = '';
    this.searchLastName = '';
    this.searchAdmissionNo = '';
    this.selectedClassId = '';
    this.selectedSectionId = '';
    this.sections = [];
    this.currentPage = 0;
    this.loadStudents();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadStudents();
  }

  // ─── Navigation ─────────────────────────────────────────────────

  onAddStudent(): void {
    this.studentState.clear();
    this.router.navigate(['students', 'add']);
  }

  /**
   * Student object ko state service mein store karke edit page pe jaate hain.
   * Kyunki backend pe getById endpoint nahi hai, list ka data hi use karte hain.
   */
  onEditStudent(student: StudentResponseDto): void {
    this.studentState.setEditStudent(student);
    this.router.navigate(['students', 'edit', student.id]);
  }

  // ─── Pagination helpers ─────────────────────────────────────────

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

  get startIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
