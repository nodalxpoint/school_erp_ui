import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { FeeListStateService } from '../../services/fee-list-state.service';
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
export class FeeListComponent implements OnInit, OnDestroy {
  fees: StudentFeeResponseDto[] = [];
  loading = false;

  filters: FeeFilterRequest = {
    page: 0, size: 10,
    academicSessionId: '', classId: '', sectionId: '', feeStructureId: '', paymentStatus: '',
    feeMonth: undefined, feeYear: undefined
  };

  sessions: DropdownOption[] = [];
  classes: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  feeStructures: DropdownOption[] = [];
  yearOptions: number[] = [];

  studentSearchQuery = '';
  selectedStudent: any = null;
  dynamicStudentsList: any[] = [];
  showSuggestions = false;
  totalPages = 0;

  // Debounced student-name autocomplete + cleanup
  private studentSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private feeService: FeeService,
    private listState: FeeListStateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildYearOptions();
    this.restoreState();
    this.loadDropdowns();

    // If a class filter was restored, its sections need to be loaded too
    if (this.filters.classId) {
      this.loadSectionsFor(this.filters.classId);
    }

    // Debounce the student autocomplete: waits 350ms after typing stops,
    // skips repeat calls for the same term, and switchMap cancels any
    // in-flight request if the user keeps typing.
    this.studentSearch$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(term => {
          if (term.length < 2) {
            this.dynamicStudentsList = [];
            this.showSuggestions = false;
            this.cdr.markForCheck();
            return of(null);
          }
          return this.feeService.getStudentsList(term);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(res => {
        if (res) {
          this.dynamicStudentsList = res;
          this.showSuggestions = true;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildYearOptions(): void {
    const current = new Date().getFullYear();
    this.yearOptions = [];
    for (let y = current + 1; y >= current - 5; y--) {
      this.yearOptions.push(y);
    }
  }

  // ── State persistence ────────────────────────────────────────

  private restoreState(): void {
    const saved = this.listState.get();
    if (!saved) return;

    this.filters.academicSessionId = saved.academicSessionId;
    this.filters.classId = saved.classId;
    this.filters.sectionId = saved.sectionId;
    this.filters.paymentStatus = saved.paymentStatus;
    this.filters.feeMonth = saved.feeMonth;
    this.filters.feeYear = saved.feeYear;
    this.filters.page = saved.page;
    this.filters.size = saved.size;
    this.studentSearchQuery = saved.studentSearchQuery;
    this.selectedStudent = saved.selectedStudent;
  }

  private persistState(): void {
    this.listState.save({
      academicSessionId: this.filters.academicSessionId || '',
      classId: this.filters.classId || '',
      sectionId: this.filters.sectionId || '',
      paymentStatus: this.filters.paymentStatus || '',
      feeMonth: this.filters.feeMonth,
      feeYear: this.filters.feeYear,
      page: this.filters.page,
      size: this.filters.size,
      studentSearchQuery: this.studentSearchQuery,
      selectedStudent: this.selectedStudent,
    });
  }

  loadDropdowns(): void {
    this.feeService.getParams('academic_sessions').subscribe(data => {
      this.sessions = data;
      // Only default to the first session if nothing was restored
      if (this.sessions && this.sessions.length > 0 && !this.filters.academicSessionId) {
        this.filters.academicSessionId = this.sessions[0].id;
      }
      this.onSearch(true);
      this.cdr.markForCheck();
    });
    this.feeService.getParams('classes').subscribe(data => { this.classes = data; this.cdr.markForCheck(); });
    this.feeService.getParams('fee_structures').subscribe(data => { this.feeStructures = data; this.cdr.markForCheck(); });
  }

  private loadSectionsFor(classId: string): void {
    this.feeService.getParams('sections', classId).subscribe(data => {
      this.sections = data;
      this.cdr.markForCheck();
    });
  }

  // Called from the student-name input's (input) event — pushes into the
  // debounced autocomplete stream instead of calling the API every keystroke.
  onStudentSearchInput(): void {
    const term = this.studentSearchQuery ? this.studentSearchQuery.trim() : '';
    this.studentSearch$.next(term);
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
    this.onSearch(true);
  }

  clearSelectedStudent(): void {
    this.selectedStudent = null;
    this.studentSearchQuery = '';
    this.dynamicStudentsList = [];
    this.showSuggestions = false;
    this.cdr.markForCheck();
    this.onSearch(true);
  }

  onStudentBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }, 200);
  }

  // Class change loads the relevant sections and resets sectionId,
  // but does NOT trigger a search — user still needs to hit "Search".
  onClassChange(): void {
    this.filters.sectionId = '';
    this.sections = [];
    if (this.filters.classId) {
      this.loadSectionsFor(this.filters.classId);
    }
    this.persistState();
  }

  // Session, Section, Status, Month, Year no longer auto-search on change.
  // They just persist the current selection; actual API call happens
  // only when the user clicks the "Search" button (onSearch(true)).
  onFilterChange(): void {
    this.persistState();
  }

  onSearch(resetPage = false): void {
    if (resetPage) {
      this.filters.page = 0;
    }
    this.persistState();
    this.loading = true;
    const cleanPayload: any = {
      page: this.filters.page, size: this.filters.size
    };

    if (this.filters.academicSessionId) cleanPayload.academicSessionId = this.filters.academicSessionId;
    if (this.filters.feeStructureId) cleanPayload.feeStructureId = this.filters.feeStructureId;

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
      classId: '', sectionId: '', feeStructureId: '', paymentStatus: '',
      feeMonth: undefined, feeYear: undefined
    };
    this.selectedStudent = null;
    this.studentSearchQuery = '';
    this.dynamicStudentsList = [];
    this.showSuggestions = false;
    this.sections = [];
    this.totalPages = 0;
    this.listState.clear();
    this.onSearch(true);
  }

  // ── FIXED: Proper relative link matrix redirection ──
  openFeeForm(rowToModify?: StudentFeeResponseDto): void {
    if (rowToModify) {
      if (rowToModify.id) {
        // Existing record → Edit
        this.router.navigate(['../edit', rowToModify.id], {
          relativeTo: this.route,
          state: { data: rowToModify }
        });
      } else {
        // PENDING virtual row (id = null) → Pay Now → Add form with pre-filled data
        this.router.navigate(['../add'], {
          relativeTo: this.route,
          state: { data: rowToModify }
        });
      }
    } else {
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

  exportToCsv(): void {
    if (!this.fees || this.fees.length === 0) return;

    const headers = [
      'Student Name',
      'Fee Structure',
      'Month',
      'Year',
      'Total Amount',
      'Paid Amount',
      'Payment Status',
      'Due Date',
      'Paid At',
      'Remarks'
    ];

    const rows = this.fees.map(f => [
      f.studentName || '',
      f.feeStructureName || '',
      f.feeMonth != null ? f.feeMonth : '',
      f.feeYear != null ? f.feeYear : '',
      f.totalAmount != null ? f.totalAmount : '',
      f.paidAmount != null ? f.paidAmount : '',
      f.paymentStatus || '',
      f.dueDate || '',
      f.paidAt || '',
      f.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fee_records_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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