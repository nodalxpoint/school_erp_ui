import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamMarksService, TeacherTimetableEntryDto } from '../../services/exam-marks.service';
import { ExamSubjectDto } from '../../../exam-schedule/models/exam-schedule.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-exam-marks-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-marks-subject-list.component.html',
  styleUrls: ['./exam-marks-subject-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamMarksSubjectListComponent implements OnInit, OnDestroy {
  subjectsList: ExamSubjectDto[] = [];
  sessions: ParamDropdownOption[] = [];
  examTerms: ParamDropdownOption[] = [];

  // ✅ Admin selection list structures
  teachers: ParamDropdownOption[] = [];
  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];

  isLoading = false;
  isAdmin = false;

  // ✅ Global filters model strictly handling unified payload properties
  filterModel = {
    academicSessionId: '',
    examId: '',
    teacherId: '',
    classId: '',
    sectionId: ''
  };

  // ✅ Raw teacherTimetable rows (used to derive class/section dropdowns + lookup)
  private timetableRows: TeacherTimetableEntryDto[] = [];

  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private marksService: ExamMarksService,
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
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      };
      this.currentDateTimeStr = now.toLocaleString('en-US', options);
      this.currentDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][now.getDay()];
      this.cdr.markForCheck();
    };
    runClock();
    this.timerIntervalId = setInterval(runClock, 1000);
  }

  checkUserRoleAndLoad(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authState.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
        this.loadCoreAcademicConfigurations();
      }
    });
  }

  loadCoreAcademicConfigurations(): void {
    // 1. Fetch common academic sessions for both roles
    this.marksService.getParamOptions('academic_sessions').subscribe(sessionsData => {
      this.sessions = sessionsData;
      if (this.sessions.length > 0) {
        this.filterModel.academicSessionId = this.sessions[0].id;
      }

      if (this.isAdmin) {
        // 🔒 ADMIN FLOW: Load Teachers, then fetch that teacher's timetable to derive class/section
        this.marksService.getParamOptions('teachers').subscribe(teachersData => {
          this.teachers = teachersData;
          if (this.teachers.length > 0) {
            this.filterModel.teacherId = this.teachers[0].id;
            this.loadTeacherTimetable();
          } else {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      } else {
        // 🔓 TEACHER FLOW: First fetch real teacherId via myClass (auth user object's id does NOT match backend teacherId)
        this.marksService.getMyClassDetails().subscribe({
          next: (res) => {
            if (res.success && res.data && res.data.teacherId) {
              this.filterModel.teacherId = res.data.teacherId;
              this.loadTeacherTimetable();
            } else {
              this.isLoading = false;
              this.cdr.markForCheck();
            }
          },
          error: () => { this.isLoading = false; this.cdr.markForCheck(); }
        });
      }
    });
  }

  // ✅ Fetches teacherTimetable/list and derives unique class/section dropdown options from it
  // Backend requires academicSessionId for both Admin and Teacher flows — always sent
  loadTeacherTimetable(): void {
    if (!this.filterModel.teacherId || !this.filterModel.academicSessionId) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.marksService.getTeacherTimetable(this.filterModel.teacherId, this.filterModel.academicSessionId).subscribe({
      next: (res) => {
        this.timetableRows = res.data ?? [];

        // Derive unique classes from timetable rows
        const classMap = new Map<string, string>();
        for (const row of this.timetableRows) {
          if (!classMap.has(row.classId)) classMap.set(row.classId, row.className);
        }
        this.classes = Array.from(classMap, ([id, label]) => ({ id, label }));

        if (this.classes.length > 0) {
          this.filterModel.classId = this.classes[0].id;
          this.refreshSectionsForSelectedClass();
        } else {
          this.filterModel.classId = '';
          this.sections = [];
          this.filterModel.sectionId = '';
        }

        this.loadExamTermsDropdown();
      },
      error: () => {
        this.timetableRows = [];
        this.classes = [];
        this.sections = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ✅ Derives section dropdown options for the currently selected class (client-side, from timetableRows)
  refreshSectionsForSelectedClass(): void {
    const sectionMap = new Map<string, string>();
    for (const row of this.timetableRows) {
      if (row.classId === this.filterModel.classId && !sectionMap.has(row.sectionId)) {
        sectionMap.set(row.sectionId, row.sectionName);
      }
    }
    this.sections = Array.from(sectionMap, ([id, label]) => ({ id, label }));
    this.filterModel.sectionId = this.sections.length > 0 ? this.sections[0].id : '';
  }

  // ✅ Triggered when Admin changes Teacher dropdown -> re-fetch timetable for new teacher
  onTeacherDropdownChange(): void {
    this.loadTeacherTimetable();
  }

  // ✅ Triggered when Class standard dropdown changes -> purely client-side filter, no new API call
  onClassDropdownChange(): void {
    this.refreshSectionsForSelectedClass();
    this.onFetchSubjects();
  }

  onSectionDropdownChange(): void {
    this.onFetchSubjects();
  }

  loadExamTermsDropdown(): void {
    if (!this.filterModel.academicSessionId) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.marksService.getExamsWithSubjects({
      page: 0, size: 100, academicSessionId: this.filterModel.academicSessionId
    }).subscribe(res => {
      this.examTerms = (res.data ?? []).map(e => ({ id: e.examId, label: e.examName }));

      if (this.examTerms.length > 0) {
        this.filterModel.examId = this.examTerms[0].id;
        this.onFetchSubjects();
      } else {
        this.examTerms = [];
        this.subjectsList = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFetchSubjects(): void {
    if (!this.filterModel.academicSessionId || !this.filterModel.examId || !this.filterModel.classId) {
      this.subjectsList = [];
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Pure backend post request parameters payload (No custom client-side storage processing)
    const payload: any = {
      page: 0,
      size: 50,
      academicSessionId: this.filterModel.academicSessionId,
      examId: this.filterModel.examId,
      classId: this.filterModel.classId
    };

    // Include teacher constraint tracking conditionally if admin query is active
    if (this.isAdmin && this.filterModel.teacherId) {
      payload.teacherId = this.filterModel.teacherId;
    }

    this.marksService.getExamsWithSubjects(payload).subscribe({
      next: (res) => {
        const responseData = res.data ?? [];

        if (responseData.length > 0) {
          const matchedExam = responseData.find(e => e.examId === this.filterModel.examId) || responseData[0];

          if (matchedExam) {
            const rawSubjects = matchedExam.examSubjects || (matchedExam as any).subjects || [];

            // ✅ DIRECT RENDER FROM BACKEND RESPONSE (Only filters by current active class standard bounds)
            this.subjectsList = rawSubjects.filter((sub: any) => sub.classId === this.filterModel.classId);
          } else {
            this.subjectsList = [];
          }
        } else {
          this.subjectsList = [];
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.subjectsList = []; this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  onFetchStudents(subject: ExamSubjectDto): void {
    // ✅ Lookup current selected exam's display name from examTerms dropdown options
    const matchedExamTerm = this.examTerms.find(e => e.id === this.filterModel.examId);
    const examName = matchedExamTerm ? matchedExamTerm.label : '';

    this.router.navigate(['/exam-marks/entry'], {
      queryParams: {
        subjectId: subject.id,
        examId: this.filterModel.examId,
        sessionId: this.filterModel.academicSessionId,
        subjectName: subject.subjectName,
        examName: examName,
        // ✅ Naya Addition: Yeh parameters Admin aur Teacher dono ke liye aage pass ho jayenge
        classId: this.filterModel.classId,
        sectionId: this.filterModel.sectionId
      }
    });
  }
}