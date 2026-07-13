// src/app/modules/udise/udise.routes.ts

import { Routes } from '@angular/router';
import { UdiseListComponent } from './components/udise-list/udise-list.component';

export const UDISE_ROUTES: Routes = [
  {
    path: '',
    component: UdiseListComponent
  }
];
