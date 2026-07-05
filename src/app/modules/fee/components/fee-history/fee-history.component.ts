import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
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

  // Student search
  studentSearchControl = new FormControl('');
  studentResults       = signal<any[]>([]);
  selectedStudent      = signal<any>(null);
  showStudentDropdown  = signal(false);

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

  constructor(private feeService: FeeService) {}

  ngOnInit(): void {
    this.loadAcademicSessions();

    this.studentSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.trim().length < 2) {
            this.studentResults.set([]);
            this.showStudentDropdown.set(false);
            return [];
          }
          return this.feeService.getStudentsList(term);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => {
        this.studentResults.set(res ?? []);
        this.showStudentDropdown.set(this.studentResults().length > 0);
      });
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
  }

  search(): void {
    const student = this.selectedStudent();
    if (!student || !this.selectedSessionId) return;

    this.loading.set(true);
    this.searched.set(true);
    this.errorMsg.set('');

    // Service maps: outer { success, data: MonthlyFeeStatusResponse } → res = MonthlyFeeStatusResponse
    this.feeService.getMonthlyFeeStatus(student.id, this.selectedSessionId)
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

  reset(): void {
    this.selectedSessionId = this.academicSessions()[0]?.id ?? '';
    this.clearStudent();
  }
}