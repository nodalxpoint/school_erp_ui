import { Routes } from '@angular/router';

export const UPLOADED_FILES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./uploaded-files.component').then(m => m.UploadedFilesComponent)
  }
];