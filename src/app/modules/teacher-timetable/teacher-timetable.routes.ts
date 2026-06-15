import { Routes } from '@angular/router';

export const TEACHER_TIMETABLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/teacher-timetable-list/teacher-timetable-list.component').then(
        m => m.TeacherTimetableListComponent
      ),
    title: 'Teacher Schedule Matrix'
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./components/teacher-timetable-form/teacher-timetable-form.component').then(
        m => m.TeacherTimetableFormComponent
      ),
    title: 'Add New Faculty Slot'
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/teacher-timetable-form/teacher-timetable-form.component').then(
        m => m.TeacherTimetableFormComponent
      ),
    title: 'Modify Faculty Slot Mapping'
  }
];