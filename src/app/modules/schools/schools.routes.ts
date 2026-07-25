import { Routes } from '@angular/router';
import { SchoolListComponent } from './pages/school-list.component';
import { SchoolFormComponent } from './pages/school-form.component';
import { SchoolDashboardComponent } from './pages/school-dashboard.component';

export const SCHOOLS_ROUTES: Routes = [
  { path: '', component: SchoolListComponent },
  { path: 'form', component: SchoolFormComponent },
  { path: 'form/:id', component: SchoolFormComponent },
  { path: ':id', component: SchoolDashboardComponent },
];
