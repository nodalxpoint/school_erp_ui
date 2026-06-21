import { Routes } from '@angular/router';

export const EXAM_MARKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./components/exam-marks-subject-list/exam-marks-subject-list.component').then(
        m => m.ExamMarksSubjectListComponent
      ),
    title: 'Exam Subject Allocations'
  },
  {
    path: 'entry',
    loadComponent: () => 
      import('./components/exam-marks-entry-form/exam-marks-entry-form.component').then(
        m => m.ExamMarksEntryFormComponent
      ),
    title: 'Student Marks Evaluation'
  }
];