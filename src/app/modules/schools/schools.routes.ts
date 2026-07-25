import { Routes } from '@angular/router';
import { SchoolListComponent } from './pages/school-list.component';
import { SchoolFormComponent } from './pages/school-form.component';
import { SchoolDashboardComponent } from './pages/school-dashboard.component';
import { PlatformAdminsComponent } from './pages/platform-admins.component';

export const SCHOOLS_ROUTES: Routes = [
  { path: '', component: SchoolListComponent },
  { path: 'form', component: SchoolFormComponent },
  { path: 'form/:id', component: SchoolFormComponent },
  // Must come before ':id' — otherwise 'admins' is swallowed as a school id param.
  { path: 'admins', component: PlatformAdminsComponent },
  { path: ':id', component: SchoolDashboardComponent },
];
