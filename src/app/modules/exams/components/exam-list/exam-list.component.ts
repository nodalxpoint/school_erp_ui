import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamDto, ExamFilterRequest } from '../../models/exam.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamListComponent implements OnInit, OnDestroy {
  exams: ExamDto[] = [];
  sessions: ParamDropdownOption[] = [];
  isLoading = false;
  isAdmin = false;
  
  // ✅ Changes track karne ke liye variables
  hasChanges = false;
  originalExams: ExamDto[] = []; 

  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  private destroy$ = new Subject<void>();

  filter: ExamFilterRequest = {
    page: 0, size: 50, sortBy: 'startDate', sortDirection: 'desc',
    academicSessionId: '', examName: ''
  };

  constructor(
    private examService: ExamService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startLiveClock();
    this.checkUserRoleAccess();
    this.loadSessionsAndInitialData();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkUserRoleAccess(): void {
    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
          this.cdr.markForCheck();
        }
      });
  }

  startLiveClock(): void {
    const runClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      };
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      this.currentDateTimeStr = now.toLocaleString('en-US', options);
      this.currentDayName = weekdays[now.getDay()];
      this.cdr.markForCheck();
    };
    runClock();
    this.timerIntervalId = setInterval(runClock, 1000);
  }

  loadSessionsAndInitialData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.examService.getAcademicSessions().subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.filter.academicSessionId = this.sessions[0].id;
      }
      this.loadExams();
    });
  }

  loadExams(): void {
    this.isLoading = true;
    this.hasChanges = false; // Reset changes on fresh load
    this.cdr.markForCheck();

    const payload = { ...this.filter };
    if (payload.examName === '') payload.examName = undefined;

    this.examService.getExamsList(payload).subscribe({
      next: (res) => {
        this.exams = res.data ?? [];
        // Deep copy backups for reverting if needed
        this.originalExams = JSON.parse(JSON.stringify(this.exams));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  // ✅ LOCAL TOGGLE SELECTION (No API Call here)
  onToggleActiveStatus(targetExam: ExamDto, event: Event): void {
    event.stopPropagation();
    if (!this.isAdmin) return;

    const previousState = targetExam.isActive; 
    const isChecking = previousState !== 'Y';

    // UI par local state update karo (strictly single active constraint ke sath)
    this.exams = this.exams.map(ex => {
      if (ex.examId === targetExam.examId) {
        return { ...ex, isActive: isChecking ? 'Y' : 'N' };
      } else {
        return isChecking ? { ...ex, isActive: 'N' as const } : ex;
      }
    });

    this.hasChanges = true; // Isse UI par "Save Changes" button visible ho jayega
    this.cdr.markForCheck();
  }

  // ✅ NEW METHOD: Click hone par actual API save call chalegi
  onSaveChanges(): void {
    if (!this.isAdmin || !this.hasChanges) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    // Jo active ('Y') kiya hua ya badla hua target exam hai use find karo
    const changedExam = this.exams.find((ex, index) => ex.isActive !== this.originalExams[index].isActive);

    if (!changedExam) {
      this.hasChanges = false;
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Tumhari addOrUpdateExam / updateExamStatus API trigger hogi
    this.examService.updateExamStatus(changedExam).subscribe({
      next: (res) => {
        this.hasChanges = false;
        this.loadExams(); // Fresh data sync karo list me
      },
      error: () => {
        alert('Failed to update status on server.');
        this.onCancelChanges(); // Revert back instantly
      }
    });
  }

  // Optional: Changes ko cancel karne ke liye helper method
  onCancelChanges(): void {
    this.exams = JSON.parse(JSON.stringify(this.originalExams));
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  onAddExam(): void {
    if (!this.isAdmin) return;
    this.router.navigate(['/exams/add']);
  }

  onEditExam(exam: ExamDto, event: Event): void {
    event.stopPropagation();
    if (!this.isAdmin) return;
    this.router.navigate(['/exams', exam.examId || (exam as any).id, 'edit'], {
      state: { exam: exam }
    });
  }
}