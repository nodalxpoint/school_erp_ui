import { Routes } from '@angular/router';
import { FeeManagementComponent } from './pages/fee-management/fee-management.component';
import { FeeListComponent } from './components/fee-list/fee-list.component';
import { FeeFormComponent } from './components/fee-form/fee-form.component';

export const FEE_ROUTES: Routes = [
  {
    path: '',
    component: FeeManagementComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: FeeListComponent },
      { path: 'add', component: FeeFormComponent },
      { path: 'edit/:id', component: FeeFormComponent }
    ],
  },
];