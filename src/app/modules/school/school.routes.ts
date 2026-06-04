import { Routes } from '@angular/router';
import { ClassManagementComponent } from './pages/class-management/class-management.component';

export const SCHOOL_ROUTES: Routes = [
  {
    path: '',
    component: ClassManagementComponent
  }
];