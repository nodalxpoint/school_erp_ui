// modules/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { User, UserRole } from '../../core/models/auth.model';

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
    { title: 'Total Students', value: '1,248', change: '+12 this month', changeType: 'up',      icon: 'graduation-cap', color: 'blue'   },
    { title: 'Teachers',       value: '86',    change: '+3 this month',  changeType: 'up',      icon: 'users',          color: 'purple' },
    { title: 'Fee Collected',  value: '₹8.4L', change: '92% collected',  changeType: 'up',      icon: 'credit-card',    color: 'green'  },
    { title: 'Attendance',     value: '94.2%', change: '-0.8% vs last',  changeType: 'down',    icon: 'calendar-check', color: 'orange' },
  ],
  ADMIN: [
    { title: 'Total Students', value: '1,248', change: '+12 this month', changeType: 'up',      icon: 'graduation-cap', color: 'blue'   },
    { title: 'Teachers',       value: '86',    change: '+3 this month',  changeType: 'up',      icon: 'users',          color: 'purple' },
    { title: 'Fee Collected',  value: '₹8.4L', change: '92% collected',  changeType: 'up',      icon: 'credit-card',    color: 'green'  },
    { title: 'Attendance',     value: '94.2%', change: '-0.8% vs last',  changeType: 'down',    icon: 'calendar-check', color: 'orange' },
  ],
  TEACHER: [
    { title: 'My Students',     value: '156',   change: '4 sections',    changeType: 'neutral', icon: 'graduation-cap', color: 'blue'   },
    { title: "Today's Classes", value: '6',     change: '2 remaining',   changeType: 'neutral', icon: 'book-open',      color: 'purple' },
    { title: 'Attendance %',    value: '91.3%', change: 'This week',     changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Pending Tasks',   value: '4',     change: 'Assignments',   changeType: 'neutral', icon: 'clipboard',      color: 'orange' },
  ],
  STUDENT: [
    { title: 'Attendance',  value: '88%',    change: 'This semester', changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Fees Due',    value: '₹4,500', change: 'Due in 5 days', changeType: 'down',    icon: 'credit-card',    color: 'red'    },
    { title: 'Assignments', value: '3',      change: 'Due this week', changeType: 'neutral', icon: 'clipboard',      color: 'orange' },
    { title: 'Subjects',    value: '8',      change: 'This term',     changeType: 'neutral', icon: 'book-open',      color: 'blue'   },
  ],
  PARENT: [
    { title: "Child's Attend.", value: '88%',    change: 'This semester', changeType: 'up',      icon: 'calendar-check', color: 'green'  },
    { title: 'Fees Due',        value: '₹4,500', change: 'Due in 5 days', changeType: 'down',    icon: 'credit-card',    color: 'red'    },
    { title: 'Notices',         value: '2',      change: 'Unread',        changeType: 'neutral', icon: 'bell',           color: 'purple' },
    { title: 'Exams',           value: '3',      change: 'Upcoming',      changeType: 'neutral', icon: 'file-text',      color: 'orange' },
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
    { label: 'Add School',   icon: 'user-plus',   route: '/schools/new', color: 'blue'   },
    { label: 'Add Admin',    icon: 'user-plus',   route: '/admins/new',  color: 'purple' },
    { label: 'View Reports', icon: 'bar-chart-3', route: '/reports',     color: 'orange' },
    { label: 'Settings',     icon: 'clipboard',   route: '/settings',    color: 'green'  },
  ],
  ADMIN: [
    { label: 'Add Student',  icon: 'user-plus',   route: '/students/new',  color: 'blue'   },
    { label: 'Add Teacher',  icon: 'user-plus',   route: '/teachers/new',  color: 'purple' },
    { label: 'Collect Fee',  icon: 'credit-card', route: '/fees/collect',  color: 'green'  },
    { label: 'View Reports', icon: 'bar-chart-3', route: '/reports',       color: 'orange' },
  ],
  TEACHER: [
    { label: 'Take Attend.', icon: 'calendar-check', route: '/attendance/mark', color: 'green'  },
    { label: 'My Students',  icon: 'users',           route: '/students',        color: 'blue'   },
    { label: 'My Classes',   icon: 'book-open',       route: '/classes',         color: 'purple' },
    { label: 'Reports',      icon: 'bar-chart-3',     route: '/reports',         color: 'orange' },
  ],
  STUDENT: [
    { label: 'Attendance', icon: 'calendar-check', route: '/attendance', color: 'green'  },
    { label: 'Pay Fees',   icon: 'credit-card',    route: '/fees',       color: 'blue'   },
    { label: 'Timetable',  icon: 'clock',          route: '/timetable',  color: 'purple' },
    { label: 'Results',    icon: 'award',          route: '/results',    color: 'orange' },
  ],
  PARENT: [
    { label: 'Attendance', icon: 'calendar-check', route: '/attendance', color: 'green'  },
    { label: 'Pay Fees',   icon: 'credit-card',    route: '/fees',       color: 'blue'   },
    { label: 'Notices',    icon: 'bell',           route: '/notices',    color: 'purple' },
    { label: 'Results',    icon: 'award',          route: '/results',    color: 'orange' },
  ],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  stats: StatCard[] = [];
  quickActions: QuickAction[] = [];
  recentActivity: ActivityItem[] = RECENT_ACTIVITY;
  today = new Date();

  weekAttendance = [
    { day: 'Mon', pct: 96 }, { day: 'Tue', pct: 91 },
    { day: 'Wed', pct: 94 }, { day: 'Thu', pct: 88 },
    { day: 'Fri', pct: 93 }, { day: 'Sat', pct: 75 },
  ];

  feeBreakdown = [
    { label: 'Collected', value: 840000, pct: 92, color: 'green'  },
    { label: 'Pending',   value: 60000,  pct: 6,  color: 'orange' },
    { label: 'Overdue',   value: 12000,  pct: 2,  color: 'red'    },
  ];

  constructor(public authState: AuthStateService) {}

  ngOnInit(): void {
    this.user = this.authState.currentUser;
    const role: UserRole = this.user?.role ?? 'STUDENT';
    this.stats        = ROLE_STATS[role];
    this.quickActions = ROLE_QUICK_ACTIONS[role];
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN' || this.user?.role === 'SUPER_ADMIN';
  }

  get isSuperAdmin(): boolean { return this.user?.role === 'SUPER_ADMIN'; }
  get isTeacher():    boolean { return this.user?.role === 'TEACHER'; }

  get firstName(): string {
    return this.user?.name ? this.user.name.split(' ')[0] : '';
  }

  formatCurrency(val: number): string {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)   return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  }
}