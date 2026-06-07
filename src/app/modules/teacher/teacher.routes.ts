import { Routes } from '@angular/router';
import { TeacherManagementComponent } from './pages/teacher-management/teacher-management.component';
import { TeacherListComponent } from './components/teacher-list/teacher-list.component';
import { TeacherFormComponent } from './components/teacher-form/teacher-form.component';
import { TeacherDetailComponent } from './components/teacher-detail/teacher-detail.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherManagementComponent,
    children: [
      { path: '',           redirectTo: 'list', pathMatch: 'full' },
      { path: 'list',       component: TeacherListComponent },
      { path: 'add',        component: TeacherFormComponent },
      { path: 'edit/:id',   component: TeacherFormComponent },
      { path: 'detail/:id', component: TeacherDetailComponent },
    ],
  },
];
