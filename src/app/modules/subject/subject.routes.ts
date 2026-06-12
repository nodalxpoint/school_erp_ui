import { Routes } from '@angular/router';

export const SUBJECT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'manage',
        pathMatch: 'full'
      },
      {
        path: 'manage',
        loadComponent: () =>
          import('./pages/subject-management.component').then(
            (m) => m.SubjectManagementComponent
          ),
        title: 'Subject Management | School ERP'
      },
      {
        path: 'assign-teacher',
        loadComponent: () =>
          import('./components/assign-subject/subject-assignment.component').then(
            (m) => m.SubjectAssignmentComponent
          ),
        title: 'Assign Subject Teacher | School ERP'
      }
    ]
  }
];