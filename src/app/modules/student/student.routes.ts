import { Routes } from '@angular/router';
import { StudentManagementComponent } from './pages/student-management/student-management.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentManagementComponent
  }
];