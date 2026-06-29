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
  isExamActive = true; // ✅ Tracks whether active exam sequence exists in registry

  filterModel = {
    academicSessionId: ''
  };

  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  
  // Track active exam runtime data safely
  private activeExamId = '';
  private activeExamName = 'Active Exam';

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

    // 1. Pehle global parameter configurations call karke status verify karenge
    this.marksService.getActiveExamFromParam().subscribe({
      next: (examRes) => {
        if (examRes.success && examRes.data && examRes.data.length > 0) {
          this.activeExamId = examRes.data[0].id;
          this.activeExamName = examRes.data[0].label;
          this.isExamActive = true;
        } else {
          this.isExamActive = false; // ✅ Data null/empty hone par state lock
        }

        // 2. Uske baad baki sessions aur class roster maps populate karenge
        this.marksService.getParamOptions('academic_sessions').subscribe(sessionsData => {
          this.sessions = sessionsData;
          if (this.sessions.length > 0) {
            this.filterModel.academicSessionId = this.sessions[0].id;
          }

          const targetTeacherId = '6112735d-2ca2-445e-8568-0bb98c58ee9e';

          this.marksService.getTeacherClassesList(targetTeacherId).subscribe({
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
      },
      error: () => {
        this.isExamActive = false;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFetchStudents(item: TeacherClassMapDto): void {
    if (!this.isExamActive) return; // Prevent navigation route breach if disabled

    this.router.navigate(['/teacher-mapping/entry'], {
      queryParams: {
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        classId: item.classId,
        sectionId: item.sectionId,
        sessionId: this.filterModel.academicSessionId,
        examId: this.activeExamId,
        examName: this.activeExamName
      }
    });
  }
}