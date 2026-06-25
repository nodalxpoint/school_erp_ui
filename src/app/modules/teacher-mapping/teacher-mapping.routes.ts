import { Routes } from '@angular/router';

export const TEACHER_MAPPING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./components/teacher-mapping-subject-list/teacher-mapping-subject-list.component').then(
        m => m.TeacherMappingSubjectListComponent
      ),
    title: 'Exam Subject Allocations'
  },
  {
    path: 'entry',
    loadComponent: () => 
      import('./components/teacher-mapping-entry-form/teacher-mapping-entry-form.component').then(
        m => m.TeacherMappingEntryFormComponent
      ),
    title: 'Student Marks Evaluation'
  }
];