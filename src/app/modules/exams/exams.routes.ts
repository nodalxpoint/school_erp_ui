import { Routes } from '@angular/router';

export const EXAMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/exam-list/exam-list.component').then(m => m.ExamListComponent),
    title: 'Examination Registry Management'
  },
  {
    path: 'add',
    loadComponent: () => import('./components/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    title: 'Register New Exam'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/exam-form/exam-form.component').then(m => m.ExamFormComponent),
    title: 'Modify Exam Parameters'
  }
];