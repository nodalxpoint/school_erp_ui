import { Routes } from '@angular/router';
import { ParentDashboardComponent } from './pages/parent-dashboard/parent-dashboard.component';

export const PARENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        component: ParentDashboardComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];