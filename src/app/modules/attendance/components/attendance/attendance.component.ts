import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { StudentAttendanceRow } from '../../models/attendance.model';
import { TeacherService, ParamDropdownOption } from '../../../teacher/services/teacher.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit, OnDestroy {
  // Live clock
  currentDateTime = '';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  classes: ParamDropdownOption[] = [];
  sections: ParamDropdownOption[] = [];
  sessions: ParamDropdownOption[] = [];

  selectedClassId = '';
  selectedSectionId = '';
  selectedSessionId = '';
  selectedDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  studentRows: StudentAttendanceRow[] = [];
  isLoading = false;
  isSaving = false;
  isTeacherClassAllocated = false;
  isAttendanceAlreadyTaken = false;

  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
    this.loadInitialConfigurations();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
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
    }, 4500); // 4.5 seconds for enhanced readability of bad request text
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

          // ✅ FIX 1: Evaluate backend attendance status constraints immediately
          if (res.data.attendanceCheck === 'ATTENDANCE_TAKEN') {
            this.isAttendanceAlreadyTaken = true;
          }

          this.classes = [{ id: res.data.classId, label: res.data.className }];
          this.sections = [{ id: res.data.sectionId, label: res.data.sectionName }];

          this.loadAttendanceSheet();
        } else {
          // ✅ FIX 2: Call list lookup endpoints only when the user is an Admin
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
        this.selectedDate, // ✅ FIX: Pass user-selected date to service
      )
      .subscribe({
        next: (res: any) => {
          const studentList = res?.data ?? [];
          this.studentRows = studentList.map((stu: any) => ({
            studentId: stu.id ?? stu.studentId,
            rollNumber: stu.rollNo ?? '—',
            firstName: stu.firstName,
            lastName: stu.lastName ?? '',

            // If attendance exists, use it; otherwise default to ABSENT
            status: stu.attendance?.status ?? 'ABSENT',

            // If attendance exists, show remarks
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
    if (this.isAttendanceAlreadyTaken) return; // Prevent mutation
    this.studentRows.forEach((row) => (row.status = status));
    this.cdr.markForCheck();
  }

  setStatus(row: StudentAttendanceRow, status: 'PRESENT' | 'ABSENT'): void {
    if (this.isAttendanceAlreadyTaken) return; // Prevent mutation
    row.status = status;
    this.cdr.markForCheck();
  }

  onSubmitAttendance(): void {
    if (this.studentRows.length === 0 || this.isAttendanceAlreadyTaken) return;
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
        this.isAttendanceAlreadyTaken = true; // Block UI actions locally immediately upon success
        this.showToast('Attendance records saved successfully to server!', 'success');
        this.loadAttendanceSheet();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isSaving = false;
        // ✅ FIX 3: Dynamic fallback parsing logic to intercept exception response payload text
        const backendMessage =
          err?.error?.message || 'Attendance has already been submitted for this class.';
        this.showToast(backendMessage, 'error');
        this.cdr.markForCheck();
      },
    });
  }
}