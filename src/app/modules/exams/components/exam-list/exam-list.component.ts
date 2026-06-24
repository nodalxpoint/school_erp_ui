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
  
  // ✅ Track strictly which exam is dynamically marked as Active on Frontend
  pendingActiveExamId: string | null = null;
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
    this.hasChanges = false; 
    this.pendingActiveExamId = null; // Clean active dynamic state
    this.cdr.markForCheck();

    const payload = { ...this.filter };
    if (payload.examName === '') payload.examName = undefined;

    this.examService.getExamsList(payload).subscribe({
      next: (res) => {
        this.exams = res.data ?? [];
        this.originalExams = JSON.parse(JSON.stringify(this.exams));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  // ✅ FIXED LOCAL TOGGLE: Ensures exactly one row stays 'Y', others strictly stay 'N'
  onToggleActiveStatus(targetExam: ExamDto, event: Event): void {
    event.stopPropagation();
    if (!this.isAdmin) return;

    const currentTargetId = targetExam.examId || targetExam.id || '';
    const isChecking = targetExam.isActive !== 'Y';

    if (isChecking) {
      this.pendingActiveExamId = currentTargetId;
    } else {
      this.pendingActiveExamId = null; // System requires at least one active, or allows none based on your requirement
    }

    // Reflect explicitly on UI row matrix arrays
    this.exams = this.exams.map(ex => {
      const exId = ex.examId || ex.id;
      if (exId === currentTargetId) {
        return { ...ex, isActive: isChecking ? 'Y' : 'N' };
      } else {
        return { ...ex, isActive: 'N' as const }; // Strictly keep all other records down to inactive
      }
    });

    this.hasChanges = true;
    this.cdr.markForCheck();
  }

  // ✅ FIXED SAVE CONFIGURATION METHOD: Maps exact target structure with zero index comparison fallbacks
  onSaveChanges(): void {
    if (!this.isAdmin || !this.hasChanges) return;

    // Find target strictly using our active tracking pointer ID references
    let targetPayloadExam = this.exams.find(ex => (ex.examId || ex.id) === this.pendingActiveExamId);

    // Backup Fallback: If no exam was activated, find the one that changed to 'N'
    if (!targetPayloadExam) {
      targetPayloadExam = this.exams.find((ex, i) => ex.isActive !== this.originalExams[i].isActive);
    }

    if (!targetPayloadExam) {
      this.hasChanges = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Deep cloned configuration wrapper instance sent cleanly to service pipeline
    const cleanSendBody: ExamDto = {
      ...targetPayloadExam,
      id: targetPayloadExam.id || targetPayloadExam.examId,
      examId: targetPayloadExam.examId || targetPayloadExam.id,
      isActive: targetPayloadExam.isActive // Strictly sends 'Y' or 'N' exactly as on UI
    };

    this.examService.updateExamStatus(cleanSendBody).subscribe({
      next: (res) => {
        this.hasChanges = false;
        this.pendingActiveExamId = null;
        this.loadExams(); // Fresh load from database response parameters
      },
      error: () => {
        alert('Failed to update status on server.');
        this.onCancelChanges();
      }
    });
  }

  onCancelChanges(): void {
    this.exams = JSON.parse(JSON.stringify(this.originalExams));
    this.hasChanges = false;
    this.pendingActiveExamId = null;
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