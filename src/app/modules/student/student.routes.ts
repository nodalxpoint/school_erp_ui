import { Routes } from '@angular/router';
import { StudentManagementComponent } from './pages/student-management/student-management.component';
import { StudentListComponent } from './components/student-list/student-list.component';
import { StudentFormComponent } from './components/student-form/student-form.component';
import { StudentDetailComponent } from './components/student-detail/student-detail.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentManagementComponent,
    children: [
      { path: '',           redirectTo: 'list', pathMatch: 'full' },
      { path: 'list',       component: StudentListComponent },
      { path: 'add',        component: StudentFormComponent },
      { path: 'edit/:id',   component: StudentFormComponent },
      { path: 'detail/:id', component: StudentDetailComponent },
    ],
  },
];
