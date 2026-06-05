import { Routes } from '@angular/router';
import { ClassManagementComponent } from './page/class-management.component';
import { ClassFormPageComponent } from './page/class-form-page.component';

export const CLASS_ROUTES: Routes = [
  {
    path: '',
    component: ClassManagementComponent,
    runGuardsAndResolvers: 'always'  // ← ye add karo
  },
  {
    path: 'form',
    component: ClassFormPageComponent
  },
  {
    path: 'form/:id',
    component: ClassFormPageComponent
  }
];