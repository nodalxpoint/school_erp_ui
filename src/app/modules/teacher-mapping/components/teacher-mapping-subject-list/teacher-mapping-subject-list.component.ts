import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamMarksService, TeacherClassMapDto } from '../../services/teacher-mapping.service';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';

@Component({
  selector: 'app-exam-marks-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-mapping-subject-list.component.html',
  styleUrls: ['./teacher-mapping-subject-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherMappingSubjectListComponent implements OnInit, OnDestroy {
  classesMappedList: TeacherClassMapDto[] = [];
  sessions: ParamDropdownOption[] = [];
  isLoading = false;

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

  loadSessionsAndClassesData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.marksService.getParamOptions('academic_sessions').subscribe(sessionsData => {
      this.sessions = sessionsData;
      if (this.sessions.length > 0) {
        this.filterModel.academicSessionId = this.sessions[0].id;
      }

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

  // ✅ UPDATED INTERCEPT FLOW: Pehle active exam parameter details nikalega fir navigation karega
  onFetchStudents(item: TeacherClassMapDto): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.marksService.getActiveExamFromParam().subscribe({
      next: (examRes) => {
        let activeExamId = '';
        let activeExamName = 'Active Exam';

        if (examRes.success && examRes.data && examRes.data.length > 0) {
          activeExamId = examRes.data[0].id;     // "a826b700-20bc-4fd8-8e73-078497cd26d9"
          activeExamName = examRes.data[0].label; // "Half-Early"
        } else {
          alert('Warning: No active examination configure parameter detected on server.');
        }

        // Active Exam context data append karke route inject karo!
        this.router.navigate(['/teacher-mapping/entry'], {
          queryParams: {
            subjectId: item.subjectId,
            subjectName: item.subjectName,
            classId: item.classId,
            sectionId: item.sectionId,
            sessionId: this.filterModel.academicSessionId,
            examId: activeExamId,      // Dynamic Active Exam ID injected here!
            examName: activeExamName   // Dynamic Active Exam Name mapping!
          }
        });
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to establish connection to retrieve active examination scope metadata.');
        this.cdr.markForCheck();
      }
    });
  }
}