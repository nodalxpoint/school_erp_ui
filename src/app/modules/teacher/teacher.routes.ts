import { Routes } from '@angular/router';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/teacher-management/teacher-management.component').then(
        m => m.TeacherManagementComponent
      )
  }
];