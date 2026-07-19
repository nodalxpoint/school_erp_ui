// src/app/modules/exam-schedule/components/exam-schedule-list/exam-schedule-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamScheduleService, ParamDropdownOption } from '../../services/exam-schedule.service';
import { ExamSubjectDto } from '../../models/exam-schedule.model';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const EXS_STATE_KEY = 'exs_exam_schedule_state_v1';

interface PersistedExsState {
  academicSessionId: string;
  examId: string;
  classId: string;
}

@Component({
  selector: 'app-exam-schedule-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-schedule-list.component.html',
  styleUrls: ['./exam-schedule-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamScheduleListComponent implements OnInit, OnDestroy {
  scheduledSubjects: ExamSubjectDto[] = [];

  sessions: ParamDropdownOption[] = [];
  examTerms: ParamDropdownOption[] = [];
  classes: ParamDropdownOption[] = [];

  isLoading = false;
  isAdmin = false;
  hasSearched = false; // Tracks if the user clicked the fetch button at least once

  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  private destroy$ = new Subject<void>();

  // ✅ naya — sessionStorage se restore hone tak yahi hold rakhta hai
  private restoredFilter: Partial<PersistedExsState> = {};

  // ✅ naya — abhi-abhi add/edit form se save karke wapas aaye ho to
  // wahi class/exam yaha capture ho jaata hai (navigation state ke through)
  private incomingFilter: Partial<PersistedExsState> = {};

  // Local model bound to dropdown values
  filterModel = {
    academicSessionId: '',
    examId: '',
    classId: ''
  };

  // Active configuration used inside the final API post request mapping
  activeFilter = {
    academicSessionId: '',
    examId: '',
    classId: ''
  };

  constructor(
    private scheduleService: ExamScheduleService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ naya — form component se save hone ke baad bheja gaya
    // classId/examId yaha pakdo (constructor me hi, taaki restoreState()
    // se pehle priority mil jaaye)
    const currentNav = this.router.getCurrentNavigation();
    const stateData = currentNav?.extras.state || history.state;

    if (stateData?.['justCreatedClassId'] || stateData?.['justCreatedExamId']) {
      this.incomingFilter = {
        classId: stateData['justCreatedClassId'] || undefined,
        examId: stateData['justCreatedExamId'] || undefined
      };
    }
  }

  ngOnInit(): void {
    this.startLiveClock();
    this.checkUserRoleAccess();
    this.restoreState();
    this.loadInitialDropdowns();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
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

  // ─── State persistence: session/exam/class selection yaad rehta
  // hai jab tum doosre page pe jaake wapas is list pe aate ho ──────
  private restoreState(): void {
    try {
      const raw = sessionStorage.getItem(EXS_STATE_KEY);
      if (raw) {
        this.restoredFilter = JSON.parse(raw) as PersistedExsState;
      }
    } catch {
      // corrupt/inaccessible storage — silently ignore, defaults apply
    }

    // ✅ naya — agar hum abhi-abhi ek schedule create/update karke aaye hain,
    // to wo sabse latest signal hai — purane sessionStorage filter ko override karo
    if (this.incomingFilter.classId) {
      this.restoredFilter.classId = this.incomingFilter.classId;
    }
    if (this.incomingFilter.examId) {
      this.restoredFilter.examId = this.incomingFilter.examId;
    }
  }

  private persistState(): void {
    try {
      const toSave: PersistedExsState = {
        academicSessionId: this.activeFilter.academicSessionId,
        examId: this.activeFilter.examId,
        classId: this.activeFilter.classId
      };
      sessionStorage.setItem(EXS_STATE_KEY, JSON.stringify(toSave));
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

  loadInitialDropdowns(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.scheduleService.getDropdownOptions('academic_sessions').subscribe(sessionsData => {
      this.sessions = sessionsData;

      if (this.sessions.length > 0) {
        const restoredSessionValid = !!this.restoredFilter.academicSessionId &&
          this.sessions.some(s => s.id === this.restoredFilter.academicSessionId);

        this.filterModel.academicSessionId = restoredSessionValid
          ? this.restoredFilter.academicSessionId!
          : this.resolveDefaultSessionId(this.sessions);
      }

      this.scheduleService.getDropdownOptions('classes').subscribe(classesData => {
        this.classes = classesData;

        if (this.classes.length > 0) {
          const restoredClassValid = !!this.restoredFilter.classId &&
            this.classes.some(c => c.id === this.restoredFilter.classId);

          this.filterModel.classId = restoredClassValid
            ? this.restoredFilter.classId!
            : this.classes[0].id;
        }

        // Load dependent dropdown values silently
        this.loadExamTermsDropdown(true);
      });
    });
  }

  loadExamTermsDropdown(isInitialLoad = false): void {
    if (!this.filterModel.academicSessionId) return;

    this.scheduleService.getExamsWithSubjects({
      page: 0, size: 100, academicSessionId: this.filterModel.academicSessionId
    }).subscribe(res => {
      this.examTerms = (res.data ?? []).map(e => ({
        id: e.examId,
        label: e.examName
      }));

      if (this.examTerms.length > 0) {
        const restoredExamValid = !!this.restoredFilter.examId &&
          this.examTerms.some(e => e.id === this.restoredFilter.examId);

        this.filterModel.examId = restoredExamValid
          ? this.restoredFilter.examId!
          : this.examTerms[0].id;
      } else {
        this.filterModel.examId = '';
      }

      this.isLoading = false;

      if (isInitialLoad && this.filterModel.examId) {
        this.onFetchSchedule();
      }

      this.cdr.markForCheck();
    });
  }

  // 🔥 CORE FIX: Completely removed frontend client-side filtering logic
  onFetchSchedule(): void {
    if (!this.filterModel.academicSessionId || !this.filterModel.examId) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.cdr.markForCheck();

    this.activeFilter = { ...this.filterModel };

    const payload = {
      page: 0,
      size: 50,
      academicSessionId: this.activeFilter.academicSessionId,
      examId: this.activeFilter.examId,
      classId: this.activeFilter.classId || undefined
    };

    this.scheduleService.getExamsWithSubjects(payload).subscribe({
      next: (res) => {
        const responseData = res.data ?? [];

        if (responseData.length > 0) {
          // Find the active matched exam record object
          const currentExam = responseData.find(e => e.examId === this.activeFilter.examId) || responseData[0];

          // ✅ FIX: Directly map whatever list backend sends in response (Supports 'examSubjects' or service fallback 'subjects')
          if (currentExam) {
            this.scheduledSubjects = currentExam.examSubjects || (currentExam as any).subjects || [];
          } else {
            this.scheduledSubjects = [];
          }
        } else {
          this.scheduledSubjects = [];
        }

        this.isLoading = false;
        this.persistState();
        this.cdr.markForCheck();
      },
      error: () => {
        this.scheduledSubjects = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

 onAddSchedule(): void {
    if (!this.isAdmin) return;
    this.router.navigate(['/exam-schedule/add'], {
      queryParams: {
        sessionId: this.filterModel.academicSessionId,
        examId: this.filterModel.examId,
        classId: this.filterModel.classId
      }
    });
  }

  onEditSchedule(item: ExamSubjectDto): void {
    if (!this.isAdmin) return;
    this.router.navigate([`/exam-schedule/${item.id}/edit`], {
      state: { schedule: item }
    });
  }
}