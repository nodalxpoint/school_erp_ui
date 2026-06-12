// modules/attendance/attendance.routes.ts

import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/attendance/attendance.component').then(
        (m) => m.AttendanceComponent
      ),
    title: 'Student Attendance Register | School ERP'
  }
];