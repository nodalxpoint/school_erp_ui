// src/app/modules/timetable/components/timetable-list/timetable-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimetableDto, TimetableFilterRequest } from '../../models/timetable.model';
import { TimetableService, ParamDropdownOption } from '../../services/timetable.service';

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

  // UI state toggles & Live Timer
  viewMode: 'weekly' | 'daily' = 'weekly';
  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;

  // Dropdown data references
  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  teachers: ParamDropdownOption[] = [];
  subjects: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  // Matrix Structural Layout Setup
  daysList = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  periodsList = [1, 2, 3, 4, 5, 6, 7, 8];

  // Default Filter Request State Parameters
  filter: TimetableFilterRequest = {
    page: 0, size: 200, sortBy: 'period', sortDirection: 'asc',
    classId: '', sectionId: '', teacherId: '', dayOfWeek: ''
  };

  constructor(
    private timetableService: TimetableService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startLiveSystemTimer();
    this.loadInitialMatrixConfigurations();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  // ✅ FRONTEND UPGRADE 1: Live clock timer logic runner handler
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

 // ✅ FIXED: Param type modified to accept 'string | undefined' flawlessly
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

// ✅ FIXED: Param type modified to accept 'string | undefined' flawlessly
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

  loadInitialMatrixConfigurations(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.timetableService.getOptions('academic_sessions').subscribe(data => {
      this.sessions = data;
      this.cdr.markForCheck();
    });

    this.timetableService.getOptions('classes').subscribe({
      next: (classList) => {
        this.classes = classList;
        if (this.classes.length > 0) {
          this.filter.classId = this.classes[0].id;
          
          this.timetableService.getSectionOptions(this.filter.classId).subscribe({
            next: (sectionList) => {
              this.sections = sectionList;
              if (this.sections.length > 0) {
                this.filter.sectionId = this.sections[0].id;
              }
              this.loadTimetables();
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
  }

  loadTimetables(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const cleanFilter: any = { ...this.filter };
    Object.keys(cleanFilter).forEach(key => {
      if (cleanFilter[key] === '') cleanFilter[key] = undefined;
    });

    this.timetableService.filterTimetable(cleanFilter).subscribe({
      next: (res) => {
        this.timetables = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getSlotData(day: string, periodNum: number): TimetableDto | undefined {
    return this.timetables.find(t => t.dayOfWeek === day && t.period === periodNum);
  }

  onClassChangeChange(): void {
    this.filter.sectionId = '';
    this.sections = [];
    this.timetables = [];
    if (this.filter.classId) {
      this.timetableService.getSectionOptions(this.filter.classId).subscribe(data => {
        this.sections = data;
        if (this.sections.length > 0) {
          this.filter.sectionId = this.sections[0].id; 
        }
        this.loadTimetables();
      });
    }
  }

  setWeeklyView(): void {
    this.viewMode = 'weekly';
    this.loadTimetables();
  }

  setDailyView(): void {
    this.viewMode = 'daily';
    this.loadTimetables();
  }

  // ✅ PERFECTED REDIRECTION: Filters loop layers based on system active day state properties
  get filteredDays(): string[] {
    if (this.viewMode === 'daily') {
      const systemDay = this.currentDayName.toUpperCase();
      
      // Fallback: Agar school off holiday hai ya boundary structure se match nahi krta -> load MONDAY
      if (systemDay === 'SUNDAY' || !this.daysList.includes(systemDay)) {
        return ['MONDAY'];
      }
      return [systemDay];
    }
    return this.daysList;
  }

  onAddTimetable(): void {
    this.router.navigate(['/timetable/add']);
  }

  onEditTimetable(item: TimetableDto): void {
    this.router.navigate(['/timetable', item.id, 'edit'], {
      state: { timetable: item }
    });
  }
}