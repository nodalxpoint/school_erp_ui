// src/app/modules/timetable/components/timetable-list/timetable-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TimetableDto, TimetableFilterRequest } from '../../models/timetable.model';
import { TimetableService, ParamDropdownOption } from '../../services/timetable.service';
import { TimetableUiStateService } from '../../services/timetable-ui-state.service';

@Component({
  selector: 'app-timetable-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timetable-list.component.html',
  styleUrls: ['./timetable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimetableListComponent implements OnInit, OnDestroy {
  timetables: TimetableDto[] = [];
  isLoading = false;
  loadError = false;

  // UI state toggles & Live Timer
  viewMode: 'weekly' | 'daily' = 'daily';
  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;

  // Day tab state (independent of "today" — user can click any tab)
  daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  private manualSelectedDay: string | null = null;

  // Periods (used by weekly matrix view)
  periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

  // Search (debounced)
  searchTerm = '';
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Derived / cached view-state — recomputed only when inputs actually change,
  // never inline in the template (keeps OnPush cheap).
  visibleSlots: TimetableDto[] = [];

  // Dropdown data references
  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  teachers: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  // Default Filter Request State Parameters
  filter: TimetableFilterRequest = {
    page: 0, size: 200, sortBy: 'period', sortDirection: 'asc',
    classId: '', sectionId: '', teacherId: '', dayOfWeek: '', academicSessionId: ''
  };

  constructor(
    private timetableService: TimetableService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private uiState: TimetableUiStateService
  ) {}

  ngOnInit(): void {
    this.startLiveSystemTimer();
    this.wireUpSearchDebounce();
    this.restoreOrInitializeState();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Cross-navigation state persistence ────────────────────────
  // On first-ever load this session, run the normal defaulting logic.
  // On every return visit (e.g. back from /timetable/add), restore
  // exactly what the user had selected instead of resetting to defaults.
  private restoreOrInitializeState(): void {
    if (this.uiState.hasHydratedState) {
      const snap = this.uiState.getSnapshot();
      this.filter = snap.filter;
      this.viewMode = snap.viewMode;
      this.manualSelectedDay = snap.selectedDay;
      this.searchTerm = snap.searchTerm;
    }
    this.loadInitialMatrixConfigurations();
  }

  private persistState(): void {
    this.uiState.save({
      filter: this.filter,
      viewMode: this.viewMode,
      selectedDay: this.manualSelectedDay,
      searchTerm: this.searchTerm
    });
    this.uiState.markHydrated();
  }

  // ── Live clock ──────────────────────────────────────────────
  startLiveSystemTimer(): void {
    const runClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      };
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

      this.currentDateTimeStr = now.toLocaleString('en-US', options);
      const freshDayName = weekdays[now.getDay()];

      // Only re-render if something actually changed (avoids needless CD ticks every second)
      if (freshDayName !== this.currentDayName) {
        this.currentDayName = freshDayName;
        this.recomputeVisibleSlots();
      } else {
        this.currentDayName = freshDayName;
      }
      this.cdr.markForCheck();
    };

    runClock();
    this.timerIntervalId = setInterval(runClock, 1000);
  }

  // ── Debounced search ────────────────────────────────────────
  private wireUpSearchDebounce(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.searchTerm = term;
        this.recomputeVisibleSlots();
        this.persistState();
        this.cdr.markForCheck();
      });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next((value || '').trim());
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchInput$.next('');
  }

  // ── Subject visual helpers ──────────────────────────────────
  getSubjectClass(subjectName: string | undefined): string {
    if (!subjectName) return 'sub-default';
    const sub = subjectName.toUpperCase();

    if (sub.includes('MATH')) return 'sub-math';
    if (sub.includes('SCI') || sub.includes('PHYSIC') || sub.includes('CHEM') || sub.includes('BIO')) return 'sub-science';
    if (sub.includes('ENG') || sub.includes('HINDI') || sub.includes('LANG')) return 'sub-languages';
    if (sub.includes('COMP') || sub.includes('CODA') || sub.includes('IT')) return 'sub-tech';
    if (sub.includes('SPORTS') || sub.includes('GAMES') || sub.includes('P.E')) return 'sub-sports';

    return 'sub-default';
  }

  getSubjectIcon(subjectName: string | undefined): string {
    if (!subjectName) return '📚';
    const sub = subjectName.toUpperCase();

    if (sub.includes('MATH')) return '📐';
    if (sub.includes('SCI') || sub.includes('PHYSIC') || sub.includes('CHEM')) return '🧪';
    if (sub.includes('ENG') || sub.includes('HINDI')) return '✍️';
    if (sub.includes('COMP') || sub.includes('IT')) return '💻';
    if (sub.includes('SPORTS')) return '⚽';

    return '📝';
  }

  // ── Data loading ─────────────────────────────────────────────
  loadInitialMatrixConfigurations(): void {
    this.isLoading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    this.timetableService.getOptions('academic_sessions')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sessions = data;
          if (!this.filter.academicSessionId) {
            this.filter.academicSessionId = this.resolveCurrentAcademicSessionId(data);
          }
          this.persistState();
          this.cdr.markForCheck();
        }
      });

    this.timetableService.getOptions('classes')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classList) => {
          this.classes = classList;
          if (!this.filter.classId && this.classes.length > 0) {
            this.filter.classId = this.classes[0].id;
          }
          if (this.filter.classId) {
            this.loadSectionsForSelectedClass(!this.filter.sectionId);
          } else {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => this.handleLoadError()
      });
  }

  // Picks the academic session that matches the currently running year
  // instead of blindly defaulting to the first item in the dropdown.
  // Indian school sessions usually run April → March, so Jan-Mar still
  // belongs to the session that started the previous calendar year.
  private resolveCurrentAcademicSessionId(sessions: ParamDropdownOption[]): string {
    if (!sessions.length) return '';

    const now = new Date();
    const targetStartYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();

    const withStartYear = sessions.map(s => ({
      session: s,
      startYear: this.extractStartYear(s.label)
    }));

    const exactMatch = withStartYear.find(x => x.startYear === targetStartYear);
    if (exactMatch) return exactMatch.session.id;

    // Fallback: label simply contains today's calendar year somewhere
    const currentYearMatch = withStartYear.find(x => x.startYear === now.getFullYear());
    if (currentYearMatch) return currentYearMatch.session.id;

    // Last resort: closest session by start year, else just the first one
    const knownYears = withStartYear.filter(x => x.startYear !== null) as
      { session: ParamDropdownOption; startYear: number }[];

    if (knownYears.length) {
      knownYears.sort((a, b) => Math.abs(a.startYear - targetStartYear) - Math.abs(b.startYear - targetStartYear));
      return knownYears[0].session.id;
    }

    return sessions[0].id;
  }

  private extractStartYear(label: string | undefined): number | null {
    if (!label) return null;
    const match = label.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  }

  private loadSectionsForSelectedClass(autoSelectFirstSection: boolean): void {
    const classId = this.filter.classId;
    if (!classId) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.timetableService.getSectionOptions(classId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sectionList) => {
          this.sections = sectionList;
          if (autoSelectFirstSection && this.sections.length > 0) {
            this.filter.sectionId = this.sections[0].id;
          }
          this.loadTimetables();
        },
        error: () => this.handleLoadError()
      });
  }

  loadTimetables(): void {
    this.isLoading = true;
    this.loadError = false;
    this.persistState();
    this.cdr.markForCheck();

    const cleanFilter: any = { ...this.filter };
    Object.keys(cleanFilter).forEach(key => {
      if (cleanFilter[key] === '') cleanFilter[key] = undefined;
    });

    this.timetableService.filterTimetable(cleanFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.timetables = res.data ?? [];
          this.isLoading = false;
          this.recomputeVisibleSlots();
          this.cdr.markForCheck();
        },
        error: () => this.handleLoadError()
      });
  }

  private handleLoadError(): void {
    this.isLoading = false;
    this.loadError = true;
    this.timetables = [];
    this.visibleSlots = [];
    this.cdr.markForCheck();
  }

  // ── Derived state (single source of truth for the template) ──
  private recomputeVisibleSlots(): void {
    const day = this.activeDay;
    const term = this.searchTerm.toLowerCase();

    let slots = this.timetables.filter(t => t.dayOfWeek === day);

    if (term) {
      slots = slots.filter(t =>
        (t.subjectName ?? '').toLowerCase().includes(term) ||
        (t.teacherName ?? '').toLowerCase().includes(term) ||
        (t.roomNo ?? '').toString().toLowerCase().includes(term)
      );
    }

    this.visibleSlots = [...slots].sort((a, b) => a.period - b.period);
  }

  get activeDay(): string {
    if (this.manualSelectedDay) return this.manualSelectedDay;
    const today = this.currentDayName;
    if (today === 'SUNDAY' || !this.daysList.includes(today)) return 'MONDAY';
    return today;
  }

  get isViewingToday(): boolean {
    return !this.manualSelectedDay && this.currentDayName === this.activeDay;
  }

  selectDay(day: string): void {
    this.manualSelectedDay = day;
    this.recomputeVisibleSlots();
    this.persistState();
    this.cdr.markForCheck();
  }

  // Kept for the weekly matrix view
  getSlotData(day: string, periodNum: number): TimetableDto | undefined {
    return this.timetables.find(t => t.dayOfWeek === day && t.period === periodNum);
  }

  onClassChangeChange(): void {
    this.filter.sectionId = '';
    this.sections = [];
    this.timetables = [];
    this.visibleSlots = [];
    if (this.filter.classId) {
      this.loadSectionsForSelectedClass(true);
    }
  }

  onSectionChange(): void {
    this.loadTimetables();
  }

  setWeeklyView(): void {
    this.viewMode = 'weekly';
    this.persistState();
    this.cdr.markForCheck();
  }

  setDailyView(): void {
    this.viewMode = 'daily';
    this.persistState();
    this.cdr.markForCheck();
  }

  // TrackBy functions — keeps DOM diffing cheap for OnPush lists
  trackByDay(_index: number, day: string): string {
    return day;
  }

  trackBySlotId(_index: number, slot: TimetableDto): any {
    return slot.id;
  }

  trackByPeriod(_index: number, period: number): number {
    return period;
  }

  onAddTimetable(): void {
    this.router.navigate(['/timetable/add']);
  }

  onAddTimetableForSlot(day: string, period: number): void {
    this.router.navigate(['/timetable/add'], {
      state: { prefill: { dayOfWeek: day, period } }
    });
  }

  onEditTimetable(item: TimetableDto): void {
    this.router.navigate(['/timetable', item.id, 'edit'], {
      state: { timetable: item }
    });
  }
}