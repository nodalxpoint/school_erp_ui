import { Routes } from '@angular/router';

export const EXAM_SCHEDULE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/exam-schedule-list/exam-schedule-list.component').then(m => m.ExamScheduleListComponent),
    title: 'Exam Timetable Matrix'
  },
  {
    path: 'add',
    loadComponent: () => import('./components/exam-schedule-form/exam-schedule-form.component').then(m => m.ExamScheduleFormComponent),
    title: 'Allocate Subject Exam Paper'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/exam-schedule-form/exam-schedule-form.component').then(m => m.ExamScheduleFormComponent),
    title: 'Modify Subject Routine'
  }
];