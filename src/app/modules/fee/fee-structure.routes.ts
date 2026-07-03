import { Routes } from '@angular/router';

export const FEE_STRUCTURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/fee-structure-management/fee-structure-management.component').then(m => m.FeeStructureManagementComponent),
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('./components/fee-structure-list/fee-structure-list.component').then(m => m.FeeStructureListComponent)
      },
      {
        path: 'add',
        loadComponent: () =>
          import('./components/fee-structure-form/fee-structure-form.component').then(m => m.FeeStructureFormComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./components/fee-structure-form/fee-structure-form.component').then(m => m.FeeStructureFormComponent)
      }
    ]
  }
];
