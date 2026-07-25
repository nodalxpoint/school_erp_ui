// core/services/school-profile.service.ts
//
// Caches the current tenant user's own school profile (name + logo), fetched from
// GET /school/me — resolved backend-side via TenantContext, never a client-supplied id.
// PLATFORM_ADMIN has no school and never needs this (it manages every school by id via
// the platform-admin schools UI instead).

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { HttpService } from './http.service';
import { AuthStateService } from '../auth/auth-state.service';
import { SchoolProfile } from '../models/school-profile.model';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SchoolProfileService {
  private profile$ = new BehaviorSubject<SchoolProfile | null>(null);
  private loadedForUserId: string | null = null;
  private inFlight$: Observable<SchoolProfile | null> | null = null;

  readonly profileChanges$ = this.profile$.asObservable();

  constructor(
    private http: HttpService,
    private authState: AuthStateService,
  ) {}

  ensureLoaded(): Observable<SchoolProfile | null> {
    const user = this.authState.currentUser;
    if (!user || user.role === 'PLATFORM_ADMIN') {
      return of(null);
    }

    if (this.loadedForUserId === user.id) {
      return of(this.profile$.value);
    }

    if (this.inFlight$) {
      return this.inFlight$;
    }

    const userId = user.id;
    this.inFlight$ = this.http.get<ApiEnvelope<SchoolProfile>>('/school/me').pipe(
      map((res) => res.data ?? null),
      tap((data) => {
        this.profile$.next(data);
        this.loadedForUserId = userId;
        this.inFlight$ = null;
      }),
      catchError(() => {
        this.inFlight$ = null;
        return of(null);
      }),
      shareReplay(1),
    );

    return this.inFlight$;
  }

  get current(): SchoolProfile | null {
    return this.profile$.value;
  }

  clear(): void {
    this.profile$.next(null);
    this.loadedForUserId = null;
    this.inFlight$ = null;
  }
}
