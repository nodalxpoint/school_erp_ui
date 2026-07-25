import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { User, UserRole } from '../../core/models/auth.model';
import { ParentService } from '../parent/services/parent.service';
import { ChildStudentDto } from '../parent/models/parent.model';
import { HttpService } from '../../core/services/http.service';
import { FeeService } from '../fee/services/fee.service';
import { TimetableService } from '../timetable/services/timetable.service';
import { AttendanceService } from '../attendance/services/attendance.service';

export interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  route?: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

const ROLE_STATS: Record<UserRole, StatCard[]> = {
  // PLATFORM_ADMIN never lands here — it's redirected to /schools — but the map must
  // still be exhaustive over UserRole.
  PLATFORM_ADMIN: [],
  SUPER_ADMIN: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up', icon: 'graduation-cap', color: 'blue' },
    { title: 'Faculty Members', value: '86', change: '+3 this month', changeType: 'up', icon: 'users', color: 'purple' },
    { title: 'Present ', value: '94.2%', change: '-0.8% vs last', changeType: 'down', icon: 'calendar-check', color: 'orange' },
    { title: 'Attendance Rate', value: '94.2%', change: 'Today vs total', changeType: 'up', icon: 'clipboard', color: 'green' },
  ],
  ADMIN: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up', icon: 'graduation-cap', color: 'blue' },
    { title: 'Faculty Members', value: '86', change: '+3 this month', changeType: 'up', icon: 'users', color: 'purple' },
    { title: 'Present ', value: '94.2%', change: '-0.8% vs last', changeType: 'down', icon: 'calendar-check', color: 'orange' },
    { title: 'Attendance Rate', value: '94.2%', change: 'Today vs total', changeType: 'up', icon: 'clipboard', color: 'green' },
  ],
  TEACHER: [
    { title: 'My Classroom Students', value: '156', change: '4 sections', changeType: 'neutral', icon: 'graduation-cap', color: 'blue' },
    { title: "Today's Active Classes", value: '6', change: '2 remaining', changeType: 'neutral', icon: 'book-open', color: 'purple' },
    { title: 'Class Attendance %', value: '91.3%', change: 'This week', changeType: 'up', icon: 'calendar-check', color: 'green' },
    { title: 'Pending Evaluation Tasks', value: '4', change: 'Assignments', changeType: 'neutral', icon: 'clipboard', color: 'orange' },
  ],
  STUDENT: [
    { title: 'My Total Attendance', value: '88%', change: 'This semester', changeType: 'up', icon: 'calendar-check', color: 'green' },
    { title: 'Outstanding Fees Due', value: '₹4,500', change: 'Due in 5 days', changeType: 'down', icon: 'credit-card', color: 'red' },
    { title: 'Active Assignments', value: '3', change: 'Due this week', changeType: 'neutral', icon: 'clipboard', color: 'orange' },
    { title: 'Enrolled Subjects', value: '8', change: 'This term', changeType: 'neutral', icon: 'book-open', color: 'blue' },
  ],
  PARENT: [
    { title: "Child's Attendance", value: '88%', change: 'This semester', changeType: 'up', icon: 'calendar-check', color: 'green' },
    { title: 'Outstanding Fees Due', value: '₹4,500', change: 'Due in 5 days', changeType: 'down', icon: 'credit-card', color: 'red' },
    { title: 'Unread Notices Board', value: '2', change: 'Unread', changeType: 'neutral', icon: 'bell', color: 'purple' },
    { title: 'Upcoming Exam Terms', value: '3', change: 'Upcoming', changeType: 'neutral', icon: 'file-text', color: 'orange' },
  ],
  ACCOUNTANT: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up', icon: 'graduation-cap', color: 'blue' },
    { title: 'Faculty Members', value: '86', change: '+3 this month', changeType: 'up', icon: 'users', color: 'purple' },
    { title: 'Fee Ledger Collection', value: '₹8.4L', change: '92% completed', changeType: 'up', icon: 'credit-card', color: 'green', route: '/fees' },
    { title: 'Present ', value: '94.2%', change: '-0.8% vs last', changeType: 'down', icon: 'calendar-check', color: 'orange' },
  ],
  SCHOOL_ADMIN: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up', icon: 'graduation-cap', color: 'blue', route: '/students' },
    { title: 'Faculty Members', value: '86', change: '+3 this month', changeType: 'up', icon: 'users', color: 'purple', route: '/teachers' },
    { title: 'Present ', value: '94.2%', change: '-0.8% vs last', changeType: 'down', icon: 'calendar-check', color: 'orange' },
    { title: 'Attendance Rate', value: '94.2%', change: 'Today vs total', changeType: 'up', icon: 'clipboard', color: 'green' },
  ],
};

const ROLE_QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  PLATFORM_ADMIN: [],
  SUPER_ADMIN: [
    { label: 'Add New Student', icon: 'user-plus', route: '/students/add', color: 'blue' },
    { label: 'Add Faculty', icon: 'user-plus', route: '/teachers/add', color: 'purple' },
    { label: 'Exam Registry', icon: 'bar-chart-3', route: '/exams', color: 'orange' },
    { label: 'Assign Class Teacher', icon: 'clipboard', route: '/teachers/class-teacher', color: 'green' },
  ],
  ADMIN: [
    { label: 'Register Student', icon: 'user-plus', route: '/students/add', color: 'blue' },
    { label: 'Register Teacher', icon: 'user-plus', route: '/teachers/add', color: 'purple' },
    { label: 'Collect Fees Entry', icon: 'credit-card', route: '/fees/collect', color: 'green' },
    { label: 'View Reports Panel', icon: 'bar-chart-3', route: '/reports', color: 'orange' },
  ],
  TEACHER: [
    { label: 'Mark Attendance Now', icon: 'calendar-check', route: '/attendance/mark', color: 'green' },
    { label: 'Teacher Timetable', icon: 'calendar-days', route: '/teacher-timetable', color: 'purple' },
    { label: 'Performance Reports', icon: 'bar-chart-3', route: '/attendance', color: 'orange' },
  ],
  STUDENT: [
    { label: 'Track Attendance', icon: 'calendar-check', route: '/attendance', color: 'green' },
    { label: 'Pay Semester Fees', icon: 'credit-card', route: '/fees', color: 'blue' },
  ],
  PARENT: [
    { label: 'Child Attendance', icon: 'calendar-check', route: '/parent/attendance', color: 'green' },
    { label: 'Pay Pending Fees', icon: 'credit-card', route: '/parent/fees', color: 'blue' },
    { label: 'Class Timetable', icon: 'calendar-days', route: '/parent/timetable', color: 'purple' },
    { label: 'Term Examination', icon: 'award', route: '/parent/exams', color: 'orange' },
  ],
  ACCOUNTANT: [
    { label: 'Collect Fees Entry', icon: 'credit-card', route: '/fees/collect', color: 'green' },
    { label: 'Fee Structure', icon: 'clipboard', route: '/fee-structure', color: 'blue' },
    { label: 'Fee History', icon: 'bar-chart-3', route: '/fees/history', color: 'orange' },
  ],
  SCHOOL_ADMIN: [
    { label: 'Register Student', icon: 'user-plus', route: '/students/add', color: 'blue' },
    { label: 'Register Teacher', icon: 'user-plus', route: '/teachers/add', color: 'purple' },
    { label: 'Mark Attendance Now', icon: 'calendar-check', route: '/attendance/mark', color: 'green' },
    { label: 'View Reports Panel', icon: 'bar-chart-3', route: '/reports', color: 'orange' },
  ],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  stats: StatCard[] = [];
  quickActions: QuickAction[] = [];

  currentClockTimeStr = '';
  currentDayLabelStr = '';
  private clockIntervalId: any = null;

  // ── Accountant: real fee breakdown ──
  feeBreakdown: { label: string; value: number; pct: number; color: string }[] = [];
  totalFeeCollected = 0;
  isLoadingFeeBreakdown = false;

  // ── Admin/SuperAdmin/SchoolAdmin: real weekly attendance ──
  weekAttendance: { day: string; pct: number }[] = [];
  isLoadingWeekAttendance = false;

  // ── Teacher: real today's schedule ──
  todaySchedule: { time: string; subject: string; class: string; status: 'done' | 'active' | 'upcoming' }[] = [];
  isLoadingSchedule = false;

  // ── Parent/Student: outstanding fee + attendance % ──
  outstandingFeeAmount = 0;
  outstandingFeeDueDate: string | null = null;

  showParentModal = false;
  isLoadingChildren = false;
  childrenList: ChildStudentDto[] = [];
  selectedChild: ChildStudentDto | null = null;

  constructor(
    public authState: AuthStateService,
    private parentService: ParentService,
    private cdr: ChangeDetectorRef,
    private http: HttpService,
    private feeService: FeeService,
    private timetableService: TimetableService,
    private attendanceService: AttendanceService
  ) { }

  ngOnInit(): void {
    this.startDashboardTicker();

    this.user = this.authState.currentUser;
    const role: UserRole = this.user?.role ?? 'STUDENT';
    this.stats = ROLE_STATS[role];
    this.quickActions = ROLE_QUICK_ACTIONS[role];

    if (role === 'PARENT') {
      this.selectedChild = this.parentService.getActiveChildValue();
      this.loadParentChildren();

      if (this.selectedChild) {
        this.loadOutstandingFees(this.selectedChild.id, this.selectedChild.academicSessionId);
        this.loadChildAttendancePct(this.selectedChild.id);
      }
    }

    if (role === 'STUDENT') {
      this.loadOutstandingFees(this.user?.id, this.user?.academicSessionId);
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'ACCOUNTANT' || role === 'SCHOOL_ADMIN') {
      this.loadAdminStats();
    }

    if (this.isAccountant) {
      this.loadFeeBreakdown();
    }

    if (this.showAttendanceChart) {
      this.loadWeeklyAttendance();
    }

    if (this.isTeacher) {
      this.loadTeacherSchedule();
    }

    this.cdr.markForCheck();
  }

  // ── Accountant: collected/pending/overdue split from real fee records ──
  loadFeeBreakdown(): void {
    this.isLoadingFeeBreakdown = true;
    const today = new Date().toISOString().slice(0, 10);

    this.feeService.filterFees({ page: 0, size: 2000, sortBy: 'createdAt', sortDirection: 'DESC' })
      .pipe(catchError(err => { console.error('Fee breakdown load failed:', err); return of(null); }))
      .subscribe(res => {
        this.isLoadingFeeBreakdown = false;
        if (!res || !res.data) { this.cdr.markForCheck(); return; }

        let collected = 0, pending = 0, overdue = 0;

        res.data.forEach(f => {
          const due = f.totalAmount - f.paidAmount;
          if (f.paymentStatus === 'PAID') {
            collected += f.paidAmount;
          } else if (f.paymentStatus === 'PARTIAL') {
            collected += f.paidAmount;
            if (f.dueDate && f.dueDate < today) overdue += due;
            else pending += due;
          } else if (f.paymentStatus === 'PENDING') {
            if (f.dueDate && f.dueDate < today) overdue += due;
            else pending += due;
          }
        });

        const total = collected + pending + overdue || 1;
        this.totalFeeCollected = collected;
        this.feeBreakdown = [
          { label: 'Collected Balance', value: collected, pct: Math.round((collected / total) * 100), color: 'green' },
          { label: 'Pending Invoice', value: pending, pct: Math.round((pending / total) * 100), color: 'orange' },
          { label: 'Overdue Penalty', value: overdue, pct: Math.round((overdue / total) * 100), color: 'red' },
        ];
        this.cdr.markForCheck();
      });
  }

  // ── Admin: real weekly attendance (last 6 days, school-wide) ──
  loadWeeklyAttendance(): void {
    this.isLoadingWeekAttendance = true;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: { day: string; date: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ day: dayLabels[d.getDay()], date: d.toISOString().slice(0, 10) });
    }

    const calls = days.map(d =>
      this.attendanceService.filterAttendanceRecords({ page: 0, size: 2000, attendanceDate: d.date })
        .pipe(catchError(err => { console.error(`Attendance load failed for ${d.date}:`, err); return of(null); }))
    );

    forkJoin(calls).subscribe(results => {
      this.isLoadingWeekAttendance = false;
      this.weekAttendance = results.map((res, idx) => {
        const records = res?.data ?? [];
        const total = records.length;
        const present = records.filter((r: any) => r.status === 'PRESENT').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { day: days[idx].day, pct };
      });
      this.cdr.markForCheck();
    });
  }

  // ── Teacher: real today's schedule from timetable ──
  loadTeacherSchedule(): void {
    this.isLoadingSchedule = true;
    const weekdays: ('SUNDAY'|'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY')[] =
      ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = weekdays[new Date().getDay()];

    this.timetableService.filterTimetable({
      page: 0, size: 50,
      teacherId: this.user?.id,
      dayOfWeek: todayName,
      sortBy: 'period',
      sortDirection: 'asc'
    })
      .pipe(catchError(err => { console.error('Timetable load failed:', err); return of(null); }))
      .subscribe(res => {
        this.isLoadingSchedule = false;
        if (!res || !res.data) { this.cdr.markForCheck(); return; }

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        this.todaySchedule = res.data.map(slot => {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;

          let status: 'done' | 'active' | 'upcoming' = 'upcoming';
          if (nowMinutes > endMin) status = 'done';
          else if (nowMinutes >= startMin && nowMinutes <= endMin) status = 'active';

          return {
            time: this.formatTime(slot.startTime),
            subject: slot.subjectName ?? 'Subject',
            class: `${slot.className ?? ''} - ${slot.sectionName ?? ''}`,
            status
          };
        });
        this.cdr.markForCheck();
      });
  }

  private formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  }

  // ── Parent/Student: outstanding dues (monthly status se) ──
  loadOutstandingFees(studentId: string, academicSessionId?: string): void {
    if (!studentId) return;

    const sessionId = academicSessionId || this.selectedChild?.academicSessionId;
    if (!sessionId) {
      console.warn('academicSessionId missing, cannot load monthly fee status');
      return;
    }

    this.feeService.getMonthlyFeeStatus(studentId, sessionId)
      .pipe(catchError(err => { console.error('Monthly fee status load failed:', err); return of(null); }))
      .subscribe(res => {
        if (!res || !res.months) return;

        const unpaidMonths = res.months.filter(m => m.status === 'PENDING');
        this.outstandingFeeAmount = unpaidMonths.reduce(
          (sum, m) => sum + (m.totalAmount - m.paidAmount), 0
        );
        this.outstandingFeeDueDate = unpaidMonths[0]?.monthName ?? null;

        this.updateFeeStatCard();
        this.cdr.markForCheck();
      });
  }

  // ── Parent: child attendance % ──
  loadChildAttendancePct(studentId: string): void {
    const now = new Date();
    this.parentService.getAttendanceRegistry(studentId, now.getMonth() + 1, now.getFullYear())
      .pipe(catchError(err => { console.error('Child attendance load failed:', err); return of([]); }))
      .subscribe((records: any[]) => {
        const total = records?.length ?? 0;
        const present = records?.filter(r => r.status === 'PRESENT').length ?? 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;

        const stat = this.stats.find(s => s.title === "Child's Attendance");
        if (stat) {
          stat.value = `${pct}%`;
          stat.change = 'This month';
          stat.changeType = pct >= 85 ? 'up' : 'down';
        }
        this.cdr.markForCheck();
      });
  }

  private updateFeeStatCard(): void {
    const stat = this.stats.find(s => s.title === 'Outstanding Fees Due');
    if (stat) {
      stat.value = this.formatCurrency(this.outstandingFeeAmount);
      stat.change = this.outstandingFeeDueDate ? `Pending: ${this.outstandingFeeDueDate}` : 'No dues pending';
      stat.changeType = this.outstandingFeeAmount > 0 ? 'down' : 'neutral';
    }
  }

  loadParentChildren(): void {
    this.isLoadingChildren = true;
    this.parentService.getChildrenRegistry().subscribe({
      next: (data) => {
        this.childrenList = data;
        this.isLoadingChildren = false;

        if (!this.selectedChild && this.childrenList.length > 0) {
          this.selectedChild = this.childrenList[0];
          this.parentService.setActiveChild(this.selectedChild);
          this.loadOutstandingFees(this.selectedChild.id, this.selectedChild.academicSessionId);
          this.loadChildAttendancePct(this.selectedChild.id);
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching children endpoints:', err);
        this.isLoadingChildren = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectChildProfile(child: ChildStudentDto): void {
    this.parentService.setActiveChild(child);
    this.selectedChild = child;
    this.showParentModal = false;
    this.loadOutstandingFees(child.id, child.academicSessionId);
    this.loadChildAttendancePct(child.id);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  startDashboardTicker(): void {
    const runClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      };
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      this.currentClockTimeStr = now.toLocaleString('en-US', options);
      this.currentDayLabelStr = weekdays[now.getDay()];
      this.cdr.markForCheck();
    };
    runClock();
    this.clockIntervalId = setInterval(runClock, 1000);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // Broad "admin-tier" flag — only for cosmetic labels (eyebrow badge).
  // NEVER used alone to pick charts/stats — those use the specific role
  // getters below so Accountant-only data never bleeds into School Admin's
  // view or vice versa.
  get isAdmin(): boolean {
    return this.isSuperAdmin || this.isAdminRole || this.isAccountant || this.isSchoolAdmin;
  }

  get isSuperAdmin(): boolean { return this.user?.role === 'SUPER_ADMIN'; }
  get isAdminRole(): boolean { return this.user?.role === 'ADMIN'; }
  get isSchoolAdmin(): boolean { return this.user?.role === 'SCHOOL_ADMIN'; }
  get isAccountant(): boolean { return this.user?.role === 'ACCOUNTANT'; }
  get isTeacher(): boolean { return this.user?.role === 'TEACHER'; }
  get isParent(): boolean { return this.user?.role === 'PARENT'; }
  get isStudent(): boolean { return this.user?.role === 'STUDENT'; }

  // Attendance chart — operational/admin view only, Accountant doesn't need it.
  get showAttendanceChart(): boolean {
    return this.isSuperAdmin || this.isAdminRole || this.isSchoolAdmin;
  }

  // Fee/financial chart — Accountant only.
  get showFinancialChart(): boolean {
    return this.isAccountant;
  }

  get firstName(): string {
    return this.user?.name ? this.user.name.split(' ')[0] : 'User';
  }

  formatCurrency(val: number): string {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  }

  loadAdminStats(): void {
    this.http.get<any>('/dashboard/admin/stats').subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const data = res.data;
          const total = data.totalStudents || 0;
          const present = data.presentStudents || 0;
          const attendanceRate = total > 0 ? (present / total) * 100 : 0;
          const attendanceRateStr = `${attendanceRate.toFixed(1)}%`;

          if (this.isAccountant) {
            this.stats = [
              { title: 'Total Active Students', value: total.toLocaleString(), change: 'Total enrolled', changeType: 'neutral', icon: 'graduation-cap', color: 'blue' },
              { title: 'Faculty Members', value: data.totalTeachers.toLocaleString(), change: 'Total staff', changeType: 'neutral', icon: 'users', color: 'purple' },
              { title: 'Fee Ledger Collection', value: this.formatCurrency(data.totalAmountCollected), change: 'Total collected', changeType: 'up', icon: 'credit-card', color: 'green', route: '/fees' },
              { title: 'Present ', value: present.toLocaleString(), change: `${attendanceRateStr} attendance`, changeType: 'neutral', icon: 'calendar-check', color: 'orange' }
            ];
          } else {
            this.stats = [
              { title: 'Total Active Students', value: total.toLocaleString(), change: 'Total enrolled', changeType: 'neutral', icon: 'graduation-cap', color: 'blue', route: '/students' },
              { title: 'Faculty Members', value: data.totalTeachers.toLocaleString(), change: 'Total staff', changeType: 'neutral', icon: 'users', color: 'purple', route: '/teachers' },
              { title: 'Present ', value: present.toLocaleString(), change: 'Marked present today', changeType: 'neutral', icon: 'calendar-check', color: 'orange' },
              { title: 'Attendance Rate', value: attendanceRateStr, change: 'Today vs total strength', changeType: attendanceRate >= 85 ? 'up' : 'down', icon: 'clipboard', color: 'green' }
            ];
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error fetching admin dashboard stats:', err)
    });
  }
}