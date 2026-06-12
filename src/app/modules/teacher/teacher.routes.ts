// teacher/teacher.routes.ts
import { Routes } from '@angular/router';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/teacher-management/teacher-management.component').then(
        m => m.TeacherManagementComponent
      ),
    children: [
      // /teachers → All Teachers (list)
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./components/teacher-list/teacher-list.component').then(
            m => m.TeacherListComponent
          ),
      },
      // /teachers/add → Add Teacher form  ← STATIC routes before :id
      {
        path: 'add',
        loadComponent: () =>
          import('./components/teacher-form/teacher-form.component').then(
            m => m.TeacherFormComponent
          ),
      },
      // /teachers/assign → Assign Teacher (form only)  ← STATIC routes before :id
      {
        path: 'assign',
        loadComponent: () =>
          import('./components/assign-teacher/assign-teacher.component').then(
            m => m.AssignTeacherComponent
          ),
      },
      // /teachers/class-teacher → Class Teacher (assigned list)  ← STATIC routes before :id
      {
        path: 'class-teacher',
        loadComponent: () =>
          import('./components/class-teacher-list/class-teacher-list.component').then(
            m => m.ClassTeacherListComponent
          ),
      },
      // /teachers/:id/edit → Edit Teacher form
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/teacher-form/teacher-form.component').then(
            m => m.TeacherFormComponent
          ),
      },
      // /teachers/:id → Teacher detail  ← DYNAMIC last
      {
        path: ':id',
        loadComponent: () =>
          import('./components/teacher-detail/teacher-detail.component').then(
            m => m.TeacherDetailComponent
          ),
      },
    ],
  },
];