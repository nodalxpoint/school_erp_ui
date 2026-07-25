// app.routes.ts — full updated

import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ProfileComponent } from './modules/user/components/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./modules/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },

  {
    path: '',
    loadComponent: () => import('./shared/components/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [

      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', component: ProfileComponent },

      {
        path: 'schools',
        canActivate: [roleGuard(['PLATFORM_ADMIN'])],
        loadChildren: () => import('./modules/schools/schools.routes').then(m => m.SCHOOLS_ROUTES)
      },

      {
        path: 'parent',
        canActivate: [roleGuard(['PARENT'])],
        loadChildren: () => import('./modules/parent/parent.routes').then(m => m.PARENT_ROUTES)
      },

      // Teachers root list/add/assign/class-teacher/:id → sirf admin-tier.
      // Note: TEACHER role kabhi is route pe navigate nahi hota (sidebar me sirf dropdown
      // toggle hoti hai jiske andar Teacher Timetable / Teacher Mapping alag routes hain).
      {
        path: 'teachers',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
      },

      {
        path: 'subjects',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/subject/subject.routes').then(m => m.SUBJECT_ROUTES)
      },

      // Students: parent guard admin+teacher (kyunki 'progression' child Teacher ke liye
      // hai), lekin andar STUDENT_ROUTES ke child routes khud restrict karte hain.
      {
        path: 'students',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'])],
        loadChildren: () => import('./modules/student/student.routes').then(m => m.STUDENT_ROUTES)
      },

      {
        path: 'timetable',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/timetable/timetable.routes').then(m => m.TIMETABLE_ROUTES)
      },

      // ⚠️ orphan route — koi sidebar link nahi, koi guard nahi tha. Neeche note dekho.
      {
        path: 'classes',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/class/class.routes').then(m => m.CLASS_ROUTES)
      },

      {
        path: 'attendance',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'])],
        loadChildren: () => import('./modules/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },

      {
        path: 'teacher-timetable',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'])],
        loadChildren: () => import('./modules/teacher-timetable/teacher-timetable.routes').then(m => m.TEACHER_TIMETABLE_ROUTES)
      },

      {
        path: 'exams',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/exams/exams.routes').then(m => m.EXAMS_ROUTES)
      },

      {
        path: 'exam-schedule',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/exam-schedule/exam-schedule.routes').then(m => m.EXAM_SCHEDULE_ROUTES)
      },

      {
        path: 'teacher-mapping',
        canActivate: [roleGuard(['TEACHER'])],
        loadChildren: () => import('./modules/teacher-mapping/teacher-mapping.routes').then(m => m.TEACHER_MAPPING_ROUTES)
      },

      {
        path: 'exam-marks',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/exam-marks/exam-marks.routes').then(m => m.EXAM_MARKS_ROUTES)
      },

      // Fees: parent-level me sabko allow karo jo koi bhi /fees sub-page use karte hain,
      // andar FEE_ROUTES ke children apna specific restriction lagate hain (neeche dekho).
      {
        path: 'fees',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'ACCOUNTANT'])],
        loadChildren: () => import('./modules/fee/fee.routes').then(m => m.FEE_ROUTES)
      },
      {
        path: 'fee-structure',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'])],
        loadChildren: () => import('./modules/fee/fee-structure.routes').then(m => m.FEE_STRUCTURE_ROUTES)
      },

      {
        path: 'users',
        canActivate: [roleGuard(['SUPER_ADMIN'])],
        loadChildren: () => import('./modules/user/user.routes').then(m => m.USER_ROUTES)
      },
      {
        path: 'udise',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/udise/udise.routes').then(m => m.UDISE_ROUTES)
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'])],
        loadChildren: () => import('./modules/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
    ]
  },

  { path: '**', redirectTo: 'auth/login' }
];