import { Component, OnInit, OnDestroy, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap, catchError } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { MonthlyFeeStatusResponse, MonthFeeDetail } from '../../models/fee.model';

interface DropdownOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-fee-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './fee-history.component.html',
  styleUrls: ['./fee-history.component.scss']
})
export class FeeHistoryComponent implements OnInit, OnDestroy {
  // Academic session dropdown
  academicSessions = signal<DropdownOption[]>([]);
  selectedSessionId = '';

  // Fee Structure (Fee Name) dropdown
  feeStructures = signal<DropdownOption[]>([]);
  selectedFeeStructureId = '';

  // Student search
  studentSearchControl = new FormControl('');
  studentResults       = signal<any[]>([]);
  selectedStudent      = signal<any>(null);
  showStudentDropdown  = signal(false);
  // ✅ naya — debounce ke waqt "Searching…" indicator dikhane ke liye
  searchingStudents    = signal(false);

  // API response
  monthlyStatus = signal<MonthlyFeeStatusResponse | null>(null);
  loading       = signal(false);
  searched      = signal(false);
  errorMsg      = signal('');

  // Computed summary helpers from months[]
  months = computed<MonthFeeDetail[]>(() => this.monthlyStatus()?.months ?? []);

  paidCount    = computed(() => this.months().filter(m => m.status === 'PAID').length);
  pendingCount = computed(() => this.months().filter(m => m.status === 'PENDING').length);
  totalPaid    = computed(() =>
    this.months().filter(m => m.status === 'PAID').reduce((s, m) => s + (m.paidAmount ?? 0), 0)
  );
  totalPending = computed(() =>
    this.months().filter(m => m.status === 'PENDING').reduce((s, m) => s + (m.totalAmount ?? 0), 0)
  );

  private destroy$ = new Subject<void>();

  constructor(
    private feeService: FeeService,
    private elementRef: ElementRef
  ) {}

  // ✅ naya — dropdown ke bahar kahin bhi click karo to autocomplete list
  // apne aap band ho jaayegi (pehle sirf select/clear karne par hi band hoti thi)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showStudentDropdown.set(false);
    }
  }

  ngOnInit(): void {
    this.loadAcademicSessions();
    this.loadFeeStructures();

    this.studentSearchControl.valueChanges
      .pipe(
        // ✅ naya — jaise hi user dobara type kare, purani confirmed selection
        // turant invalidate ho jaati hai (debounce se pehle hi) — warna
        // "Search" button purani selection ke saath hi chal jaata tha
        tap(() => {
          if (this.selectedStudent()) {
            this.selectedStudent.set(null);
          }
        }),
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(term => {
          const trimmed = (term ?? '').trim();
          if (trimmed.length < 2) {
            this.studentResults.set([]);
            this.showStudentDropdown.set(false);
            this.searchingStudents.set(false);
            return of([]);
          }
          this.searchingStudents.set(true);
          return this.feeService.getStudentsList(trimmed).pipe(
            catchError(() => of([]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.searchingStudents.set(false);
        this.studentResults.set(res ?? []);
        this.showStudentDropdown.set((res ?? []).length > 0);
      });

    this.restoreRecentSearch();
  }

  restoreRecentSearch(): void {
    const cached = this.feeService.getRecentSearch();
    if (cached && cached.student && cached.sessionId) {
      this.selectedStudent.set(cached.student);
      this.studentSearchControl.setValue(
        `${cached.student.firstName} ${cached.student.lastName}`,
        { emitEvent: false }
      );
      this.selectedSessionId = cached.sessionId;
      // Trigger search after a brief timeout to guarantee dropdowns have populated
      setTimeout(() => this.search(), 50);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAcademicSessions(): void {
    this.feeService.getParams('academic_sessions').subscribe(res => {
      this.academicSessions.set(res);
      if (res.length > 0 && !this.selectedSessionId) {
        this.selectedSessionId = res[0].id;
      }
    });
  }

  loadFeeStructures(): void {
    this.feeService.getParams('fee_structures').subscribe(res => {
      this.feeStructures.set(res);
    });
  }

  selectStudent(student: any): void {
    this.selectedStudent.set(student);
    this.studentSearchControl.setValue(
      `${student.firstName} ${student.lastName}`,
      { emitEvent: false }
    );
    this.showStudentDropdown.set(false);
  }

  clearStudent(): void {
    this.selectedStudent.set(null);
    this.studentSearchControl.setValue('', { emitEvent: false });
    this.studentResults.set([]);
    this.monthlyStatus.set(null);
    this.searched.set(false);
    this.errorMsg.set('');

    this.feeService.clearRecentSearch();
  }

  search(): void {
    const student = this.selectedStudent();
    if (!student || !this.selectedSessionId) return;

    this.loading.set(true);
    this.searched.set(true);
    this.errorMsg.set('');

    this.feeService.setRecentSearch(student, this.selectedSessionId);

    // Service maps: outer { success, data: MonthlyFeeStatusResponse } → res = MonthlyFeeStatusResponse
    this.feeService.getMonthlyFeeStatus(student.id, this.selectedSessionId, this.selectedFeeStructureId)
      .subscribe({
        next: (res: any) => {
          this.monthlyStatus.set(res as MonthlyFeeStatusResponse);
          this.loading.set(false);
        },
        error: () => {
          this.monthlyStatus.set(null);
          this.errorMsg.set('Failed to load fee records. Please try again.');
          this.loading.set(false);
        }
      });
  }

  exportToCsv(): void {
    const student = this.selectedStudent();
    const status = this.monthlyStatus();
    if (!student || !status || this.months().length === 0) return;

    const headers = ['Month', 'Year', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status', 'Paid At'];
    let csvContent = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    this.months().forEach(m => {
      const balance = m.totalAmount - m.paidAmount;
      const row = [
        m.monthName,
        m.feeYear,
        `₹${m.totalAmount.toFixed(2)}`,
        `₹${m.paidAmount.toFixed(2)}`,
        `₹${balance.toFixed(2)}`,
        m.status,
        m.paidAt ? m.paidAt.substring(0, 10) : '—'
      ];
      const line = row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csvContent += line + '\n';
    });

    const filename = `${status.studentName.replace(/\s+/g, '_').toLowerCase()}_fee_history_${status.sessionName.replace(/\s+/g, '_').toLowerCase()}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  reset(): void {
    this.selectedSessionId = this.academicSessions()[0]?.id ?? '';
    this.selectedFeeStructureId = '';
    this.clearStudent();
  }
}