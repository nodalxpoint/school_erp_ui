import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TimetableDto, TimetableFilterRequest } from '../models/timetable.model';

// Locally declared structures to bypass cross-module resolution errors
export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ParamListRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  type: 'classes' | 'sections' | 'teachers' | 'subjects' | 'academic_sessions';
  classId?: string;
  search?: string;
}

export interface ParamDropdownOption {
  id: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {
  private base = `${environment.apiUrl}/timetable`;
  private param = `${environment.apiUrl}/param`;

  constructor(private http: HttpClient) {}

  // ── Core Timetable APIs ──────────────────────────────────────────────────

  filterTimetable(request: TimetableFilterRequest): Observable<PagedResponse<TimetableDto>> {
    return this.http.post<PagedResponse<TimetableDto>>(`${this.base}/list`, request);
  }

  addOrUpdateTimetable(dto: TimetableDto): Observable<any> {
    return this.http.post<any>(`${this.base}/addOrUpdate`, dto);
  }

  // ── Param-based dropdowns helper using your param list API ──────────────

  getOptions(type: 'classes' | 'teachers' | 'subjects' | 'academic_sessions', search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      type: type,
      search: search || undefined
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  getSectionOptions(classId: string, search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      type: 'sections',
      classId: classId,
      search: search || undefined
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }
}