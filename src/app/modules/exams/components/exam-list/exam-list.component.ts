// src/app/modules/exams/components/exam-list/exam-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamDto, ExamFilterRequest } from '../../models/exam.model';
import { ParamDropdownOption } from '../../../timetable/services/timetable.service';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamListComponent implements OnInit, OnDestroy {
  exams: ExamDto[] = [];
  sessions: ParamDropdownOption[] = [];
  isLoading = false;
  isAdmin = false; // ✅ Checked state condition attribute

  // Real-time Running clock parameters
  currentDateTimeStr = '';
  currentDayName = '';
  private timerIntervalId: any = null;
  private destroy$ = new Subject<void>();

  // Backend Payload Filters Request State
  filter: ExamFilterRequest = {
    page: 0, size: 50, sortBy: 'startDate', sortDirection: 'desc',
    academicSessionId: '', examName: ''
  };

  constructor(
    private examService: ExamService,
    private authState: AuthStateService, // ✅ Injected safely
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startLiveClock();
    this.checkUserRoleAccess();
    this.loadSessionsAndInitialData();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Role-Based Security Identification Layer
  checkUserRoleAccess(): void {
    this.authState.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          // Unlocks edit features ONLY for Admin / Super Admin roles
          this.isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
          this.cdr.markForCheck();
        }
      });
  }

  startLiveClock(): void {
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

  loadSessionsAndInitialData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.examService.getAcademicSessions().subscribe(data => {
      this.sessions = data;
      if (this.sessions.length > 0) {
        this.filter.academicSessionId = this.sessions[0].id;
      }
      this.loadExams();
    });
  }

  loadExams(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = { ...this.filter };
    if (payload.examName === '') payload.examName = undefined;

    this.examService.getExamsList(payload).subscribe({
      next: (res) => {
        this.exams = res.data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoading = false; this.cdr.markForCheck(); }
    });
  }

  getExamStatus(start: string, end: string): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (today < startDate) return 'UPCOMING';
    if (today >= startDate && today <= endDate) return 'ACTIVE';
    return 'COMPLETED';
  }

  // 🔒 Router action method locked securely
  onAddExam(): void {
    if (!this.isAdmin) return;
    this.router.navigate(['/exams/add']);
  }

  // 🔒 Router action method locked securely
  onEditExam(exam: ExamDto): void {
    if (!this.isAdmin) return;
    this.router.navigate(['/exams', exam.id, 'edit'], {
      state: { exam: exam }
    });
  }
}