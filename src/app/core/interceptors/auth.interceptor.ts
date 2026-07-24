// core/interceptors/auth.interceptor.ts — Adds JWT to every request

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../auth/token.service';
import { AuthStateService } from '../auth/auth-state.service';
import { CurrentSchoolService } from '../auth/current-school.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tokenService = inject(TokenService);
  const authState = inject(AuthStateService);
  const currentSchool = inject(CurrentSchoolService);
  const router = inject(Router);
  const token = tokenService.getToken();

  // X-School-Id is sent for server-side logging/cross-check only. The backend must
  // never treat it as authoritative — tenant scoping is derived from the JWT alone,
  // since a client could otherwise send any value here.
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (currentSchool.schoolId) headers['X-School-Id'] = currentSchool.schoolId;

  const authReq = Object.keys(headers).length
    ? req.clone({ setHeaders: headers })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authState.clearAuth();
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};