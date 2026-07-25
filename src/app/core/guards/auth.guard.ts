// core/guards/auth.guard.ts — Protects routes that require login

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (authState.isAuthenticated) return true;

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// Blocks logged-in users from seeing login/register
export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated) return true;

  const isPlatformAdmin = authState.currentUser?.role === 'PLATFORM_ADMIN';
  router.navigate([isPlatformAdmin ? '/schools' : '/dashboard']);
  return false;
};