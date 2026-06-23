import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamMarksService, TeacherClassMapDto } from '../../services/exam-marks.service';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';

@Component({
  selector: 'app-exam-marks-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-marks-subject-list.component.html',
  styleUrls: ['./exam-marks-subject-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamMarksSubjectListComponent implements OnInit, OnDestroy {
  classesMappedList: TeacherClassMapDto[] = [];
  sessions: ParamDropdownOption[] = [];
  isLoading = false;

  // ✅ Only single filter model reference retained
  filterModel = {
    academicSessionId: ''
  };

  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;

  constructor(
    private marksService: ExamMarksService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startLiveSystemTimer();
    this.loadSessionsAndClassesData();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
  }

  startLiveSystemTimer(): void {
    const runClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      };
      this.currentDateTimeStr = now.toLocaleString('en-US', options);
      this.currentDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][now.getDay()];
      this.cdr.markForCheck();
    };
    runClock();
    this.timerIntervalId = setInterval(runClock, 1000);
  }

  loadSessionsAndClassesData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // 1. Load Academic Session Dropdown Filter Option
    this.marksService.getParamOptions('academic_sessions').subscribe(sessionsData => {
      this.sessions = sessionsData;
      if (this.sessions.length > 0) {
        this.filterModel.academicSessionId = this.sessions[0].id;
      }

      // 2. Direct single call hitting your brand new POST API endpoint 
      this.marksService.getTeacherClassesList().subscribe({
        next: (res) => {
          this.classesMappedList = res.data ?? [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.classesMappedList = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
    });
  }

  // ✅ Forwarding complete card response body metadata properties down to the form query map
  onFetchStudents(item: TeacherClassMapDto): void {
    this.router.navigate(['/exam-marks/entry'], {
      queryParams: {
        subjectId: item.subjectId,
        sessionId: this.filterModel.academicSessionId,
        subjectName: item.subjectName,
        classId: item.classId,
        sectionId: item.sectionId,
        className: item.className,
        sectionName: item.sectionName
      }
    });
  }
}