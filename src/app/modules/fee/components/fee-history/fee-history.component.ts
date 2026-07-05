import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { FeeService } from '../../services/fee.service';
import { StudentFeeResponseDto } from '../../models/fee.model';

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
  selectedSessionId = ''; // ngModel two-way bind, plain is fine (UI-driven)

  // Student search
  studentSearchControl = new FormControl('');
  studentResults = signal<any[]>([]);
  selectedStudent = signal<any>(null);
  showStudentDropdown = signal(false);

  // Fee history table
  feeHistory = signal<StudentFeeResponseDto[]>([]);
  loading = signal(false);
  searched = signal(false);

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
  }

search(): void {
  const student = this.selectedStudent();
  if (!student) {
    return;
  }

  this.loading.set(true);
  this.searched.set(true);

  this.feeService
    .filterFees({
      page: 0,
      size: 100,
      studentId: student.id,
      academicSessionId: this.selectedSessionId || undefined
    })
    .subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
        this.feeHistory.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
}

  reset(): void {
    this.selectedSessionId = '';
    this.clearStudent();
    this.feeHistory.set([]);
    this.searched.set(false);
  }
}