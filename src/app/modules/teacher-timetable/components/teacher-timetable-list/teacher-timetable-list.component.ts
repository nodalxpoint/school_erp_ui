import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TeacherTimetableService } from '../../services/teacher-timetable.service';
import { TeacherTimetableFilterRequest } from '../../models/teacher-timetable.model';
import { TimetableDto } from '../../../timetable/models/timetable.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service'; 
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-timetable-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-timetable-list.component.html',
  styleUrls: ['./teacher-timetable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherTimetableListComponent implements OnInit, OnDestroy {
  timetables: TimetableDto[] = [];
  isLoading = false;

  isTeacherRole = false;
  allocatedClassName = '';
  allocatedSectionName = '';

  viewMode: 'weekly' | 'daily' = 'weekly';
  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  private destroy$ = new Subject<void>();

  teachers: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

  filter: TeacherTimetableFilterRequest = {
    page: 0, size: 200, sortBy: 'period', sortDirection: 'asc',
    teacherId: '', academicSessionId: ''
  };

  constructor(
    private teacherTimetableService: TeacherTimetableService,
    private authState: AuthStateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startLiveSystemTimer();
    this.checkUserRoleAndLoad();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  startLiveSystemTimer(): void {
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

  checkUserRoleAndLoad(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isTeacherRole = user?.role === 'TEACHER';
        this.loadInitialConfigurations();
      });
  }

  loadInitialConfigurations(): void {
    this.teacherTimetableService.getOptions('academic_sessions').subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.filter.academicSessionId = this.sessions[0].id;
      }
      this.executeRoleBasedDataFetch();
    });
  }

  executeRoleBasedDataFetch(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    if (this.isTeacherRole) {
      // 🔓 TEACHER FLOW: Parse class, section and teacherId from response body
      this.teacherTimetableService.getMyClassDetails().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.allocatedClassName = res.data.className;
            this.allocatedSectionName = res.data.sectionName;
            
            // 🔥 FIX: Extracted teacherId from response object and passed it down to list payload
            const dynamicTeacherId = res.data.teacherId || '';
            this.filter.teacherId = dynamicTeacherId;

            this.teacherTimetableService.filterClassTimetable(
              res.data.classId, 
              res.data.sectionId, 
              this.filter.academicSessionId || '',
              dynamicTeacherId
            ).subscribe({
              next: (timetableRes) => {
                this.timetables = timetableRes.data ?? [];
                this.isLoading = false;
                this.cdr.markForCheck();
              },
              error: () => { this.isLoading = false; this.cdr.markForCheck(); }
            });
          } else {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      });
    } else {
      // 🔒 ADMIN FLOW: Load dropdown of teachers
      this.teacherTimetableService.getOptions('teachers').subscribe({
        next: (teacherList) => {
          this.teachers = teacherList;
          if (this.teachers.length > 0 && !this.filter.teacherId) {
            this.filter.teacherId = this.teachers[0].id;
          }
          this.loadTimetables();
        },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      });
    }
  }

  loadTimetables(): void {
    if (this.isTeacherRole || !this.filter.teacherId) return;
    this.isLoading = true;
    this.cdr.markForCheck();

    this.teacherTimetableService.filterTeacherTimetable(this.filter).subscribe({
      next: (res) => {
        this.timetables = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  // ✅ ROBUST MATRIX CELL FILTERING FIX: Handled strict case and type validations
  getSlotData(day: string, periodNum: number): TimetableDto | undefined {
    return this.timetables.find(t => 
      t.dayOfWeek?.toUpperCase() === day.toUpperCase() && 
      Number(t.period) === Number(periodNum)
    );
  }

  setWeeklyView(): void { this.viewMode = 'weekly'; this.executeRoleBasedDataFetch(); }
  setDailyView(): void { this.viewMode = 'daily'; this.executeRoleBasedDataFetch(); }

  get filteredDays(): string[] {
    if (this.viewMode === 'daily') {
      const systemDay = this.currentDayName.toUpperCase();
      if (systemDay === 'SUNDAY' || !this.daysList.includes(systemDay)) {
        return ['MONDAY'];
      }
      return [systemDay];
    }
    return this.daysList;
  }

  onAddTimetable(): void {
    // Guard Layer Constraint Checks
    if (this.isTeacherRole) return;
    this.router.navigate(['/teacher-timetable/add']);
  }

  onAddTimetableForSlot(day: string, period: number): void {
    // Guard Layer Constraint Checks
    if (this.isTeacherRole) return;
    this.router.navigate(['/teacher-timetable/add'], {
      state: { prefill: { dayOfWeek: day, period } }
    });
  }

  onEditTimetable(item: TimetableDto): void {
  // Guard Layer Constraint Checks
  if (this.isTeacherRole) return; 
  this.router.navigate(['/teacher-timetable', item.id, 'edit'], {
    state: { timetable: item }
  });
}

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
}