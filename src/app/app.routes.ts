import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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

      // Parent Module Integration inside the core Shell structure
      {
        path: 'parent',
        loadChildren: () => 
          import('./modules/parent/parent.routes').then(m => m.PARENT_ROUTES)
      },

      // Teachers
      {
        path: 'teachers',
        loadChildren: () =>
          import('./modules/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
      },

      // Subjects Module
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

      // Timetable Module
      {
        path: 'timetable',
        loadChildren: () =>
          import('./modules/timetable/timetable.routes').then(m => m.TIMETABLE_ROUTES)
      },

      // Classes & Sections
      {
        path: 'classes',
        loadChildren: () =>
          import('./modules/class/class.routes').then(m => m.CLASS_ROUTES)
      },

      // Attendance
      {
        path: 'attendance',
        loadChildren: () =>
          import('./modules/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },

      // Teacher Timetable
      {
        path: 'teacher-timetable',
        loadChildren: () =>
          import('./modules/teacher-timetable/teacher-timetable.routes').then(m => m.TEACHER_TIMETABLE_ROUTES)
      },

      // Exams
      {
        path: 'exams',
        loadChildren: () =>
          import('./modules/exams/exams.routes').then(m => m.EXAMS_ROUTES)
      },

      // Exam Schedule
      {
        path: 'exam-schedule',
        loadChildren: () =>
          import('./modules/exam-schedule/exam-schedule.routes').then(m => m.EXAM_SCHEDULE_ROUTES)
      },

      // Exam Marks
      {
        path: 'teacher-mapping',
        canActivate: [roleGuard(['TEACHER'])],
        loadChildren: () => 
          import('./modules/teacher-mapping/teacher-mapping.routes').then(m => m.TEACHER_MAPPING_ROUTES)
      },
      {
  path: 'exam-marks',
  loadChildren: () => import('./modules/exam-marks/exam-marks.routes').then(m => m.EXAM_MARKS_ROUTES)
}
    ]
  },

  // ── Wildcard ─────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];