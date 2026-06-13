import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { StudentAttendanceRow } from '../../models/attendance.model';
import { TeacherService, ParamDropdownOption } from '../../../teacher/services/teacher.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service'; // ← Shared Auth State import kiya
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit, OnDestroy {
  currentDateTime = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private destroy$ = new Subject<void>(); // ← Subscriptions cleanup ke liye

  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  selectedClassId = '';
  selectedSectionId = '';
  selectedSessionId = '';
  
  // Flawless Timezone Offset Calculation Fixed
  selectedDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  studentRows: StudentAttendanceRow[] = [];
  isLoading = false;
  isSaving = false;
  isTeacherClassAllocated = false;
  isAttendanceAlreadyTaken = false;
  isTeacherRole = false; // ← Track karega ki login user Teacher hai ya nahi

  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private teacherService: TeacherService,
    private authState: AuthStateService, // ← Inject AuthState reference
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);

    // ✅ FIX 1: User ke current role ko monitor karo dynamic component configuration ke liye
    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user?.role === 'TEACHER') {
          this.isTeacherRole = true;
        } else {
          this.isTeacherRole = false;
        }
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
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    this.currentDateTime = `${day}, ${date} ${month} ${year} — ${hours}:${minutes}:${seconds}`;
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
    this.teacherService.getAcademicSessionOptions().subscribe((data) => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.selectedSessionId = this.sessions[0].id;
      }
      this.checkTeacherClassAndAutoFetch();
      this.cdr.markForCheck();
    });
  }

  checkTeacherClassAndAutoFetch(): void {
    this.attendanceService.getMyClassDetails().subscribe({
      next: (res) => {
        if (res.success && res.data?.classId) {
          this.selectedClassId = res.data.classId;
          this.selectedSectionId = res.data.sectionId;
          this.isTeacherClassAllocated = true;

          if (res.data.attendanceCheck === 'ATTENDANCE_TAKEN') {
            this.isAttendanceAlreadyTaken = true;
          }

          this.classes = [{ id: res.data.classId, label: res.data.className }];
          this.sections = [{ id: res.data.sectionId, label: res.data.sectionName }];

          this.loadAttendanceSheet();
        } else {
          this.loadAllClassesViaParam();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadAllClassesViaParam();
      },
    });
  }

  loadAllClassesViaParam(): void {
    this.teacherService.getClassOptions().subscribe((data) => {
      this.classes = data;
      this.cdr.markForCheck();
    });
  }

  onClassChange(): void {
    if (this.isTeacherClassAllocated) return;

    this.selectedSectionId = '';
    this.sections = [];
    this.studentRows = [];

    if (this.selectedClassId) {
      this.teacherService.getSectionOptions(this.selectedClassId).subscribe((data) => {
        this.sections = data;
        this.cdr.markForCheck();
      });
    }
  }

  loadAttendanceSheet(): void {
    if (
      !this.selectedClassId ||
      !this.selectedSectionId ||
      !this.selectedSessionId ||
      !this.selectedDate
    ) {
      return;
    }

    this.isLoading = true;
    this.studentRows = [];
    this.cdr.markForCheck();

    this.attendanceService
      .getStudentsForAttendance(
        this.selectedClassId,
        this.selectedSectionId,
        this.selectedSessionId,
        this.selectedDate,
      )
      .subscribe({
        next: (res: any) => {
          const studentList = res?.data ?? [];
          this.studentRows = studentList.map((stu: any) => ({
            studentId: stu.id ?? stu.studentId,
            rollNumber: stu.rollNo ?? '—',
            firstName: stu.firstName,
            lastName: stu.lastName ?? '',
            status: stu.attendance?.status ?? 'ABSENT',
            remarks: stu.attendance?.remarks ?? '',
          }));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.showToast('Failed to load students register list.', 'error');
        },
      });
  }

  markAllStatus(status: 'PRESENT' | 'ABSENT'): void {
    // ✅ FIX 2: Mutation lock checks only applicable if user is a Teacher
    if (this.isAttendanceAlreadyTaken && this.isTeacherRole) return; 
    this.studentRows.forEach((row) => (row.status = status));
    this.cdr.markForCheck();
  }

  setStatus(row: StudentAttendanceRow, status: 'PRESENT' | 'ABSENT'): void {
    // ✅ FIX 3: Mutation lock checks only applicable if user is a Teacher
    if (this.isAttendanceAlreadyTaken && this.isTeacherRole) return; 
    row.status = status;
    this.cdr.markForCheck();
  }

  onSubmitAttendance(): void {
    // ✅ FIX 4: Block submit if attendance taken AND user is a Teacher
    if (this.studentRows.length === 0 || (this.isAttendanceAlreadyTaken && this.isTeacherRole)) return;
    this.isSaving = true;
    this.cdr.markForCheck();

    const payload = {
      classId: this.selectedClassId,
      sectionId: this.selectedSectionId,
      academicSessionId: this.selectedSessionId,
      attendanceDate: this.selectedDate,
      records: this.studentRows.map((row) => ({
        studentId: row.studentId,
        status: row.status,
        remarks: row.remarks || '',
      })),
    };

    this.attendanceService.submitBulkAttendance(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isAttendanceAlreadyTaken = true; // Flag true set ho jayega backend verification ke sath synchronization ke lea
        this.showToast('Attendance records saved successfully to server!', 'success');
        this.loadAttendanceSheet();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isSaving = false;
        const backendMessage =
          err?.error?.message || 'Attendance has already been submitted for this class.';
        this.showToast(backendMessage, 'error');
        this.cdr.markForCheck();
      },
    });
  }
}