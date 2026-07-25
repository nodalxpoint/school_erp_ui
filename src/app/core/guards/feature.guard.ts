// core/guards/feature.guard.ts — blocks a route if the school hasn't enabled that module.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FeatureKey } from '../models/feature.model';

export const featureGuard = (key: FeatureKey): CanActivateFn => {
  return () => {
    const featureFlags = inject(FeatureFlagService);
    const router = inject(Router);

    return featureFlags.ensureLoaded().pipe(
      map(() => {
        if (featureFlags.isEnabled(key)) return true;
        router.navigate(['/dashboard']);
        return false;
      }),
    );
  };
};
