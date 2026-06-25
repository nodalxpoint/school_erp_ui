// core/guards/parent.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { ParentService } from '../../modules/parent/services/parent.service';

export const parentGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const parentService = inject(ParentService);
  const router = inject(Router);

  if (authState.currentUser?.role === 'PARENT' && !parentService.getActiveChildValue()) {
    router.navigate(['/dashboard']); // Direct dashboard popup pe redirect handle krega
    return false;
  }
  return true;
};