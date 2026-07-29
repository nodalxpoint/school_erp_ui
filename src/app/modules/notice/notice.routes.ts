import { Routes } from '@angular/router';

export const NOTICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/notice-board/notice-board.component').then(m => m.NoticeBoardComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/notice-form/notice-form.component').then(m => m.NoticeFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/notice-form/notice-form.component').then(m => m.NoticeFormComponent)
  }
];
