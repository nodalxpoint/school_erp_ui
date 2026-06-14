import { Routes } from '@angular/router';

export const TIMETABLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/timetable-management/timetable-management.component').then(
        m => m.TimetableManagementComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/timetable-list/timetable-list.component').then(
            m => m.TimetableListComponent
          ),
        title: 'Timetable Register'
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./components/timetable-form/timetable-form.component').then(
            m => m.TimetableFormComponent
          ),
        title: 'Add New Slot Mapping'
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./components/timetable-form/timetable-form.component').then(
            m => m.TimetableFormComponent
          ),
        title: 'Modify Period Slot'
      }
    ]
  }
];