import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Default redirect ────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // ── Auth routes (no shell, no sidebar) ──────────────────────────
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./modules/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },

  // ── Shell (sidebar + topbar wrapper) — all protected routes here ─
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // Teachers
      {
        path: 'teachers',
        loadChildren: () =>
          import('./modules/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
      },

      // ── Subjects Module (Added here matching your SUBJECT_ROUTES) ──
      {
        path: 'subjects',
        loadChildren: () =>
          import('./modules/subject/subject.routes').then(m => m.SUBJECT_ROUTES)
      },

      // Students
      {
        path: 'students',
        loadChildren: () =>
          import('./modules/student/student.routes').then(m => m.STUDENT_ROUTES)
      },

      // Classes & Sections
    {
  path: 'timetable',
  loadChildren: () =>
    import('./modules/timetable/timetable.routes').then(m => m.TIMETABLE_ROUTES)
},

       {
        path: 'classes',
        loadChildren: () =>
          import('./modules/class/class.routes').then(m => m.CLASS_ROUTES)
      },

      // ── Placeholder routes — uncomment as backend modules get built ──

      {
  path: 'attendance',
  loadChildren: () =>
    import('./modules/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
}
      // {
      //   path: 'fees',
      //   loadChildren: () =>
      //     import('./modules/fees/fees.routes').then(m => m.FEES_ROUTES)
      // },
      // {
      //   path: 'reports',
      //   loadChildren: () =>
      //     import('./modules/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () =>
      //     import('./modules/settings/settings.component').then(m => m.SettingsComponent)
      // },

    ]
  },

  // ── Wildcard ─────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];