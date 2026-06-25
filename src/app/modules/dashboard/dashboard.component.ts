// src/app/modules/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { User, UserRole } from '../../core/models/auth.model';
import { ParentService } from '../parent/services/parent.service'; 
import { ChildStudentDto } from '../parent/models/parent.model';    

export interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

const ROLE_STATS: Record<UserRole, StatCard[]> = {
  SUPER_ADMIN: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up',      icon: 'graduation-cap', color: 'blue'   },
    { title: 'Faculty Members',      value: '86',    change: '+3 this month',  changeType: 'up',      icon: 'users',          color: 'purple' },
    { title: 'Fee Ledger Collection',value: '₹8.4L', change: '92% completed',  changeType: 'up',      icon: 'credit-card',    color: 'green'  },
    { title: 'Global Attendance %',  value: '94.2%', change: '-0.8% vs last',  changeType: 'down',    icon: 'calendar-check', color: 'orange' },
  ],
  ADMIN: [
    { title: 'Total Active Students', value: '1,248', change: '+12 this month', changeType: 'up',      icon: 'graduation-cap', color: 'blue'   },
    { title: 'Faculty Members',      value: '86',    change: '+3 this month',  changeType: 'up',      icon: 'users',          color: 'purple' },
    { title: 'Fee Ledger Collection',value: '₹8.4L', change: '92% completed',  changeType: 'up',      icon: 'credit-card',    color: 'green'  },
    { title: 'Global Attendance %',  value: '94.2%', change: '-0.8% vs last',  changeType: 'down',    icon: 'calendar-check', color: 'orange' },
  ],
  TEACHER: [
    { title: 'My Classroom Students',value: '156',   change: '4 sections',    changeType: 'neutral', icon: 'graduation-cap', color: 'blue'   },
    { title: "Today's Active Classes",value: '6',     change: '2 remaining',   changeType: 'neutral', icon: 'book-open',      color: 'purple' },
    { title: 'Class Attendance %',   value: '91.3%', change: 'This week',     changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Pending Evaluation Tasks',value: '4',     change: 'Assignments',   changeType: 'neutral', icon: 'clipboard',      color: 'orange' },
  ],
  STUDENT: [
    { title: 'My Total Attendance', value: '88%',    change: 'This semester', changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Outstanding Fees Due', value: '₹4,500', change: 'Due in 5 days', changeType: 'down',    icon: 'credit-card',    color: 'red'    },
    { title: 'Active Assignments',   value: '3',      change: 'Due this week', changeType: 'neutral', icon: 'clipboard',      color: 'orange' },
    { title: 'Enrolled Subjects',    value: '8',      change: 'This term',     changeType: 'neutral', icon: 'book-open',      color: 'blue'   },
  ],
  PARENT: [
    { title: "Child's Attendance",   value: '88%',    change: 'This semester', changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Outstanding Fees Due', value: '₹4,500', change: 'Due in 5 days', changeType: 'down',    icon: 'credit-card',    color: 'red'    },
    { title: 'Unread Notices Board', value: '2',      change: 'Unread',        changeType: 'neutral', icon: 'bell',           color: 'purple' },
    { title: 'Upcoming Exam Terms',  value: '3',      change: 'Upcoming',      changeType: 'neutral', icon: 'file-text',      color: 'orange' },
  ],
};

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: '1', message: 'New student Aryan Sharma enrolled in Class 10-A',    time: '2 min ago',  type: 'success' },
  { id: '2', message: 'Fee payment received from Priya Singh — ₹12,500',    time: '18 min ago', type: 'success' },
  { id: '3', message: 'Teacher Anita Joshi marked attendance for Class 9-B', time: '1 hr ago',   type: 'info'    },
  { id: '4', message: 'Salary disbursement completed for October',           time: '3 hrs ago',  type: 'info'    },
  { id: '5', message: 'Fee overdue for 14 students in Class 12',             time: 'Yesterday',  type: 'warning' },
  { id: '6', message: 'Monthly report generated for September 2025',         time: 'Yesterday',  type: 'info'    },
];

const ROLE_QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  SUPER_ADMIN: [
    { label: 'Add New School Branch', icon: 'user-plus',   route: '/schools/new', color: 'blue'   },
    { label: 'Add Faculty Admin',     icon: 'user-plus',   route: '/admins/new',  color: 'purple' },
    { label: 'View Reports Analytics',icon: 'bar-chart-3', route: '/reports',     color: 'orange' },
    { label: 'System Configuration',  icon: 'clipboard',   route: '/settings',    color: 'green'  },
  ],
  ADMIN: [
    { label: 'Register Student',  icon: 'user-plus',   route: '/students/new',  color: 'blue'   },
    { label: 'Register Teacher',  icon: 'user-plus',   route: '/teachers/new',  color: 'purple' },
    { label: 'Collect Fees Entry',icon: 'credit-card', route: '/fees/collect',  color: 'green'  },
    { label: 'View Reports Panel',icon: 'bar-chart-3', route: '/reports',       color: 'orange' },
  ],
  TEACHER: [
    { label: 'Mark Attendance Now',icon: 'calendar-check', route: '/attendance/mark', color: 'green'  },
    { label: 'View My Students',   icon: 'users',           route: '/students',        color: 'blue'   },
    { label: 'My Roster Classes',  icon: 'book-open',       route: '/classes',         color: 'purple' },
    { label: 'Performance Reports',icon: 'bar-chart-3',     route: '/reports',         color: 'orange' },
  ],
  STUDENT: [
    { label: 'Track Attendance',   icon: 'calendar-check', route: '/attendance', color: 'green'  },
    { label: 'Pay Semester Fees',  icon: 'credit-card',    route: '/fees',       color: 'blue'   },
    { label: 'Class Timetable',    icon: 'clock',          route: '/timetable',  color: 'purple' },
    { label: 'Examination Results',icon: 'award',          route: '/results',    color: 'orange' },
  ],
  PARENT: [
    { label: 'Child Attendance',   icon: 'calendar-check', route: '/attendance', color: 'green'  },
    { label: 'Pay Pending Fees',   icon: 'credit-card',    route: '/fees',       color: 'blue'   },
    { label: 'School Notices Board',icon: 'bell',          route: '/notices',    color: 'purple' },
    { label: 'Term Examination',   icon: 'award',          route: '/results',    color: 'orange' },
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
  recentActivity: ActivityItem[] = RECENT_ACTIVITY;
  
  currentClockTimeStr = '';
  currentDayLabelStr = '';
  private clockIntervalId: any = null;

  weekAttendance = [
    { day: 'Mon', pct: 96 }, { day: 'Tue', pct: 91 },
    { day: 'Wed', pct: 94 }, { day: 'Thu', pct: 88 },
    { day: 'Fri', pct: 93 }, { day: 'Sat', pct: 75 },
  ];

  feeBreakdown = [
    { label: 'Collected Balance', value: 840000, pct: 92, color: 'green'  },
    { label: 'Pending Invoice',   value: 60000,  pct: 6,  color: 'orange' },
    { label: 'Overdue Penalty',   value: 12000,  pct: 2,  color: 'red'    },
  ];

  showParentModal = false;
  isLoadingChildren = false;
  childrenList: ChildStudentDto[] = [];
  selectedChild: ChildStudentDto | null = null;

  constructor(
    public authState: AuthStateService,
    private parentService: ParentService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startDashboardTicker();
    
    this.user = this.authState.currentUser;
    const role: UserRole = this.user?.role ?? 'STUDENT';
    this.stats        = ROLE_STATS[role];
    this.quickActions = ROLE_QUICK_ACTIONS[role];

    if (role === 'PARENT') {
      this.selectedChild = this.parentService.getActiveChildValue();
      if (!this.selectedChild) {
        this.showParentModal = true;
        this.loadParentChildren();
      }
    }

    this.cdr.markForCheck();
  }

  loadParentChildren(): void {
    this.isLoadingChildren = true;
    this.parentService.getChildrenRegistry().subscribe({
      next: (data) => {
        this.childrenList = data;
        this.isLoadingChildren = false;
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

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN' || this.user?.role === 'SUPER_ADMIN';
  }

  get isSuperAdmin(): boolean { return this.user?.role === 'SUPER_ADMIN'; }
  get isTeacher():    boolean { return this.user?.role === 'TEACHER'; }
  get isParent():     boolean { return this.user?.role === 'PARENT'; } 

  get firstName(): string {
    return this.user?.name ? this.user.name.split(' ')[0] : 'User';
  }

  formatCurrency(val: number): string {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000)   return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  }
}