import { Routes } from '@angular/router';
import { TeacherManagementComponent } from './pages/teacher-management/teacher-management.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherManagementComponent,
  },
];