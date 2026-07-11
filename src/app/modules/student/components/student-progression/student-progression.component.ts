import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../services/student.service';
import { StudentFilterRequest } from '../../models/student.model';
import { ProgressionService, StudentProgressionBulkSaveDto } from '../../services/progression.service';
import { AttendanceService } from '../../../attendance/services/attendance.service';
import { TeacherService, ParamDropdownOption } from '../../../teacher/services/teacher.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface StudentProgressionRow {
  studentId: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  status: 'PASS' | 'FAIL' | '';
  remarks: string;
  classId: string;
  sectionId: string;
  sectionsList: ParamDropdownOption[];
  isSectionLoading: boolean;
}

@Component({
  selector: 'app-student-progression',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-progression.component.html',
  styleUrls: ['./student-progression.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentProgressionComponent implements OnInit, OnDestroy {
  currentDateTime = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private destroy$ = new Subject<void>();

  sessions: ParamDropdownOption[] = [];
  classesList: ParamDropdownOption[] = [];

  selectedSessionId = '';
  myClassId = '';
  mySectionId = '';
  myClassName = '';
  mySectionName = '';

  studentRows: StudentProgressionRow[] = [];
  isLoading = false;
  isSaving = false;
  isTeacherClassAllocated = false;
  isTeacherRole = false;

  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private studentService: StudentService,
    private progressionService: ProgressionService,
    private attendanceService: AttendanceService,
    private teacherService: TeacherService,
    private authState: AuthStateService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);

    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isTeacherRole = user?.role === 'TEACHER';
        this.cdr.markForCheck();
      });

    this.loadInitialConfigurations();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateClock(): void {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.currentDateTime = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} — ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    this.cdr.markForCheck();
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast = null;
      this.cdr.markForCheck();
    }, 4500);
  }

  loadInitialConfigurations(): void {
    this.teacherService.getAcademicSessionOptions().subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.selectedSessionId = this.sessions[0].id;
      }
      this.cdr.markForCheck();

      this.teacherService.getClassOptions().subscribe(classes => {
        this.classesList = classes;
        this.cdr.markForCheck();
      });

      this.checkTeacherClassAndFetchStudents();
    });
  }

  checkTeacherClassAndFetchStudents(): void {
    this.attendanceService.getMyClassDetails().subscribe({
      next: (res) => {
        if (res.success && res.data?.classId) {
          this.myClassId = res.data.classId;
          this.mySectionId = res.data.sectionId;
          this.myClassName = res.data.className;
          this.mySectionName = res.data.sectionName;
          this.isTeacherClassAllocated = true;
          this.loadStudentList();
        } else {
          this.showToast('No class allocated to you as class teacher.', 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToast('Failed to load class teacher allocation details.', 'error');
      }
    });
  }

  loadStudentList(): void {
    if (!this.myClassId || !this.mySectionId || !this.selectedSessionId) {
      return;
    }

    this.isLoading = true;
    this.studentRows = [];
    this.cdr.markForCheck();

    const reqPayload: StudentFilterRequest = {
      page: 0,
      size: 300,
      classId: this.myClassId,
      sectionId: this.mySectionId,
      sortBy: 'firstName',
      sortDirection: 'ASC'
    };

    this.studentService.filterStudents(reqPayload).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        
        this.http.post<any>(`${environment.apiUrl}/studentProgression/list`, {
          page: 0,
          size: 300,
          academicSessionId: this.selectedSessionId,
          classId: this.myClassId,
          sectionId: this.mySectionId
        }).subscribe({
          next: (progRes) => {
            const existingProgressions = progRes?.data?.data ?? [];
            const progMap = new Map<string, any>();
            existingProgressions.forEach((p: any) => {
              progMap.set(p.studentId, p);
            });

            this.studentRows = list.map((stu: any) => {
              const existing = progMap.get(stu.id);
              const row: StudentProgressionRow = {
                studentId: stu.id,
                rollNo: stu.rollNo ?? '—',
                firstName: stu.firstName,
                lastName: stu.lastName ?? '',
                status: existing ? existing.status : '',
                remarks: existing ? existing.remarks || '' : '',
                classId: existing ? existing.classId : '',
                sectionId: existing ? existing.sectionId : '',
                sectionsList: [],
                isSectionLoading: false
              };

              if (row.classId) {
                row.isSectionLoading = true;
                this.teacherService.getSectionOptions(row.classId).subscribe(sections => {
                  row.sectionsList = sections;
                  row.isSectionLoading = false;
                  this.cdr.markForCheck();
                });
              }

              return row;
            });

            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.studentRows = list.map((stu: any) => ({
              studentId: stu.id,
              rollNo: stu.rollNo ?? '—',
              firstName: stu.firstName,
              lastName: stu.lastName ?? '',
              status: '',
              remarks: '',
              classId: '',
              sectionId: '',
              sectionsList: [],
              isSectionLoading: false
            }));
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load student list.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onRowClassChange(row: StudentProgressionRow): void {
    row.sectionId = '';
    row.sectionsList = [];
    if (!row.classId) return;

    row.isSectionLoading = true;
    this.cdr.markForCheck();

    this.teacherService.getSectionOptions(row.classId).subscribe({
      next: (sections) => {
        row.sectionsList = sections;
        row.isSectionLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        row.isSectionLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSaveProgression(): void {
    const invalidRows = this.studentRows.filter(r => !r.status || !r.classId || !r.sectionId);
    if (invalidRows.length > 0) {
      this.showToast('Please specify Status, Class, and Section for all students.', 'error');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    const payload: StudentProgressionBulkSaveDto = {
      academicSessionId: this.selectedSessionId,
      progressions: this.studentRows.map(r => ({
        studentId: r.studentId,
        classId: r.classId,
        sectionId: r.sectionId,
        status: r.status as 'PASS' | 'FAIL',
        remarks: r.remarks || null
      }))
    };

    this.progressionService.addOrUpdateProgression(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToast('Student progression records saved successfully!', 'success');
        this.loadStudentList();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.message || 'Failed to save student progression.';
        this.showToast(msg, 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
