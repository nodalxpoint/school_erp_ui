// parent.routes.ts
import { Routes } from '@angular/router';
import { ParentDashboardComponent } from './pages/parent-dashboard/parent-dashboard.component';

export const PARENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: 'dashboard', component: ParentDashboardComponent },
      {
        path: 'attendance',
        loadComponent: () => import('./components/parent-attendance/parent-attendance.component').then(m => m.ParentAttendanceComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./components/parent-exams/parent-exams.component').then(m => m.ParentExamsComponent)
      },
      {
        path: 'fees',
        loadComponent: () => import('./components/parent-fees/parent-fees.component').then(m => m.ParentFeesComponent)
      },
      {
        path: 'timetable',
        loadComponent: () => import('./components/parent-timetable/parent-timetable.component').then(m => m.ParentTimetableComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];