import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ Added ActivatedRoute
import { FeeService } from '../../services/fee.service';
import { StudentFeeResponseDto, FeeFilterRequest } from '../../models/fee.model';
import { DropdownOption } from '../../../student/models/student.model';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-list.component.html',
  styleUrls: ['./fee-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeListComponent implements OnInit {
  fees: StudentFeeResponseDto[] = [];
  loading = false;

  filters: FeeFilterRequest = {
    page: 0, size: 10,
    academicSessionId: '', classId: '', sectionId: '', paymentStatus: '',
    feeMonth: undefined, feeYear: undefined
  };

  sessions: DropdownOption[] = [];
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];

  studentSearchQuery = '';
  selectedStudent: any = null;
  dynamicStudentsList: any[] = [];
  showSuggestions = false;
  totalPages = 0;

  constructor(
    private feeService: FeeService, 
    private router: Router, 
    private route: ActivatedRoute, // ✅ Injected ActivatedRoute
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  loadDropdowns(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      if (this.sessions && this.sessions.length > 0) {
        this.filters.academicSessionId = this.sessions[0].id;
      }
      this.onSearch(true);
      this.cdr.markForCheck();
    });
    this.feeService.getParams('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
  }

  onStudentSearchInput(): void {
    const term = this.studentSearchQuery ? this.studentSearchQuery.trim() : '';
    if (term.length >= 2) {
      this.feeService.getStudentsList(term).subscribe(res => {
        this.dynamicStudentsList = res;
        this.showSuggestions = true;
        this.cdr.markForCheck();
      });
    } else {
      this.dynamicStudentsList = [];
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }
  }

  selectStudent(student: any): void {
    this.selectedStudent = student;
    this.studentSearchQuery = `${student.firstName} ${student.lastName}`;
    this.showSuggestions = false;

    // Clear class, section and status since we are filtering by specific student
    this.filters.classId = '';
    this.filters.sectionId = '';
    this.filters.paymentStatus = '';
    this.sections = [];

    this.cdr.markForCheck();
  }

  clearSelectedStudent(): void {
    this.selectedStudent = null;
    this.studentSearchQuery = '';
    this.dynamicStudentsList = [];
    this.showSuggestions = false;
    this.cdr.markForCheck();
  }

  onStudentBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }, 200);
  }

  onClassChange(): void {
    this.filters.sectionId = ''; 
    this.sections = [];
    if (this.filters.classId) {
      this.feeService.getParams('sections', this.filters.classId).subscribe(data => { 
        this.sections = data; 
        this.cdr.markForCheck(); 
      });
    }
  }

  onSearch(resetPage = false): void {
    if (resetPage) {
      this.filters.page = 0;
    }
    this.loading = true;
    const cleanPayload: any = {
      page: this.filters.page, size: this.filters.size
    };

    if (this.filters.academicSessionId) cleanPayload.academicSessionId = this.filters.academicSessionId;

    if (this.selectedStudent) {
      cleanPayload.studentId = this.selectedStudent.id;
      cleanPayload.classId = this.selectedStudent.classId; // Pass classId under the hood for backend fee structure query
    } else {
      if (this.filters.classId) cleanPayload.classId = this.filters.classId;
      if (this.filters.sectionId) cleanPayload.sectionId = this.filters.sectionId;
      if (this.filters.paymentStatus) cleanPayload.paymentStatus = this.filters.paymentStatus;
    }

    if (this.filters.feeMonth !== undefined && this.filters.feeMonth !== null && String(this.filters.feeMonth) !== '') {
      cleanPayload.feeMonth = Number(this.filters.feeMonth);
    }
    if (this.filters.feeYear !== undefined && this.filters.feeYear !== null && String(this.filters.feeYear) !== '') {
      cleanPayload.feeYear = Number(this.filters.feeYear);
    }

    this.feeService.filterFees(cleanPayload).subscribe({
      next: (res: any) => {
        this.fees = res.data?.data ?? []; 
        this.totalPages = res.data?.totalPages ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { 
        this.fees = [];
        this.totalPages = 0;
        this.loading = false; 
        this.cdr.markForCheck(); 
      }
    });
  }

  clearAllFilters(): void {
    this.filters = {
      page: 0, size: 10,
      academicSessionId: this.sessions && this.sessions.length > 0 ? this.sessions[0].id : '',
      classId: '', sectionId: '', paymentStatus: '',
      feeMonth: undefined, feeYear: undefined
    };
    this.selectedStudent = null;
    this.studentSearchQuery = '';
    this.dynamicStudentsList = [];
    this.showSuggestions = false;
    this.sections = []; 
    this.totalPages = 0;
    this.onSearch(true);
  }

  // ── FIXED: Proper relative link matrix redirection ──
  openFeeForm(rowToModify?: StudentFeeResponseDto): void {
    if (rowToModify) {
      // Relative link calculation targeting: fee/edit/:id safely
      this.router.navigate(['../edit', rowToModify.id], { 
        relativeTo: this.route,
        state: { data: rowToModify } 
      });
    } else {
      // Relative link calculation targeting: fee/add safely
      this.router.navigate(['../add'], { relativeTo: this.route });
    }
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.filters.page = page;
    this.onSearch();
  }

  onPageSizeChange(): void {
    this.filters.size = Number(this.filters.size);
    this.onSearch(true);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.filters.page;
    let start   = Math.max(0, cur - 2);
    let end     = Math.min(total - 1, cur + 2);
    if (end - start < 4) {
      if (start === 0) end = Math.min(total - 1, 4);
      else             start = Math.max(0, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}