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
        path: 'timetable',
        loadComponent: () => import('./components/parent-timetable/parent-timetable.component').then(m => m.ParentTimetableComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];