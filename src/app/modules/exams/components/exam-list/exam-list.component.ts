import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamDto, ExamFilterRequest } from '../../models/exam.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

const EX_STATE_KEY = 'ex_exam_registry_state_v1';
const SEARCH_DEBOUNCE_MS = 2000;

interface PersistedExState {
  page: number;
  examName: string | undefined;
  academicSessionId: string | undefined;
}

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

  // ✅ naya — debounced search stream (2s)
  private searchInput$ = new Subject<string>();

  // ✅ naya — sessionStorage se restore hone tak yahi hold rakhta hai
  private restoredSessionId: string | undefined;
  private hasRestoredOnce = false;

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

    // ✅ debounce search: 2 seconds ruk ke hi call jayegi
    this.searchInput$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filter.page = 0;
        this.loadExams();
      });

    this.restoreState();
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
          this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'SCHOOL_ADMIN';
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

  // ─── State persistence: page/search/session yaad rehta hai
  // jab tum doosre page pe jaake wapas is list pe aate ho ────────
  private restoreState(): void {
    try {
      const raw = sessionStorage.getItem(EX_STATE_KEY);
      if (!raw) return;
      const saved: PersistedExState = JSON.parse(raw);
      this.filter.page = saved.page ?? 0;
      this.filter.examName = saved.examName ?? '';
      this.restoredSessionId = saved.academicSessionId;
    } catch {
      // corrupt/inaccessible storage — silently ignore, defaults apply
    }
  }

  private persistState(): void {
    try {
      const toSave: PersistedExState = {
        page: this.filter.page,
        examName: this.filter.examName,
        academicSessionId: this.filter.academicSessionId
      };
      sessionStorage.setItem(EX_STATE_KEY, JSON.stringify(toSave));
    } catch {
      // storage unavailable — non-fatal, just won't persist
    }
  }

  // ✅ naya — session label (e.g. "2026-2027") se saal nikal ke
  // current running academic year wala session default select hota hai
  private resolveDefaultSessionId(sessions: ParamDropdownOption[]): string {
    const currentYear = new Date().getFullYear();

    const matched = sessions.find(s => {
      const years = (s.label.match(/\d{4}/g) || []).map(Number);
      if (years.length >= 2) {
        const [start, end] = years;
        return currentYear >= start && currentYear < end;
      }
      if (years.length === 1) {
        return years[0] === currentYear;
      }
      return false;
    });

    return matched?.id ?? sessions[0]?.id ?? '';
  }

  loadSessionsAndInitialData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.examService.getAcademicSessions().subscribe(data => {
      this.sessions = data;

      if (this.sessions.length > 0) {
        const restoredIsStillValid = !!this.restoredSessionId &&
          this.sessions.some(s => s.id === this.restoredSessionId);

        this.filter.academicSessionId = restoredIsStillValid
          ? this.restoredSessionId!
          : this.resolveDefaultSessionId(this.sessions);
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
        this.persistState();
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  // ✅ naya — search box se hit hota hai; actual load 2s debounce ke baad hi
  onSearchInputChange(value: string): void {
    this.filter.examName = value;
    this.searchInput$.next(value);
  }

  onSessionChange(): void {
    this.filter.page = 0;
    this.loadExams();
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