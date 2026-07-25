// core/guards/role.guard.ts — Role-based route protection

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { UserRole } from '../models/auth.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);
    const user = authState.currentUser;

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(user.role)) return true;

    // Redirect to their own landing page. PLATFORM_ADMIN has no school, so /dashboard
    // (which is per-school) doesn't apply to it — send it to the schools list instead.
    router.navigate([user.role === 'PLATFORM_ADMIN' ? '/schools' : '/dashboard']);
    return false;
  };
};