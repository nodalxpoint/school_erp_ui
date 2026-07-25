// core/services/feature-flag.service.ts
//
// Caches the current tenant user's effective per-school feature toggles (fetched from
// GET /features/effective, which the backend resolves via the JWT-derived TenantContext —
// never a client-supplied school id). PLATFORM_ADMIN has no school and never hits
// feature-gated routes, so it resolves immediately with an empty (fail-open) map.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { HttpService } from './http.service';
import { AuthStateService } from '../auth/auth-state.service';
import { FeatureKey } from '../models/feature.model';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private features$ = new BehaviorSubject<Record<string, boolean>>({});
  private loadedForUserId: string | null = null;
  private inFlight$: Observable<Record<string, boolean>> | null = null;

  constructor(
    private http: HttpService,
    private authState: AuthStateService,
  ) {}

  ensureLoaded(): Observable<Record<string, boolean>> {
    const user = this.authState.currentUser;
    if (!user || user.role === 'PLATFORM_ADMIN') {
      return of({});
    }

    if (this.loadedForUserId === user.id) {
      return of(this.features$.value);
    }

    if (this.inFlight$) {
      return this.inFlight$;
    }

    const userId = user.id;
    this.inFlight$ = this.http.get<ApiEnvelope<Record<string, boolean>>>('/features/effective').pipe(
      map((res) => res.data ?? {}),
      tap((data) => {
        this.features$.next(data);
        this.loadedForUserId = userId;
        this.inFlight$ = null;
      }),
      catchError(() => {
        // Fail open — a failed fetch shouldn't lock users out of modules they already had.
        this.inFlight$ = null;
        return of({});
      }),
      shareReplay(1),
    );

    return this.inFlight$;
  }

  // Fail open for anything not yet loaded or not present in the map (e.g. a brand-new
  // FeatureKey the backend hasn't been asked about yet) — never surprise-hide a feature
  // due to a timing gap.
  isEnabled(key: FeatureKey): boolean {
    return this.features$.value[key] !== false;
  }

  clear(): void {
    this.features$.next({});
    this.loadedForUserId = null;
    this.inFlight$ = null;
  }
}
