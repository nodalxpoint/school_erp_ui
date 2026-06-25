import { Routes } from '@angular/router';
import { ExamMarksListComponent } from './components/exam-marks-list/exam-marks-list.component';

export const EXAM_MARKS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: ExamMarksListComponent
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];