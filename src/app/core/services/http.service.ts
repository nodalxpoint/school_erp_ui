// core/services/http.service.ts — Typed HTTP wrapper

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private apiUrl = environment.apiUrl;
  private publicApiUrl = environment.publicApiUrl;

  constructor(private http: HttpClient) {}

  // ── Public endpoints (auth) ────────────────────────────────────
  publicPost<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.publicApiUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  // ── Protected endpoints ────────────────────────────────────────
  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    return this.http
      .get<T>(`${this.apiUrl}${endpoint}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.apiUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.apiUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown) {
    return throwError(() => error);
  }
}