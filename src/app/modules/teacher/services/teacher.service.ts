import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AssignClassTeacherDto,
  ClassTeacherAssignmentFilterRequest,
  ClassTeacherAssignmentResponseDto,
  CreateTeacherDto,
  PagedResponse,
  TeacherFilterRequest,
  TeacherResponseDto
} from '../models/teacher.model';
import { environment } from '../../../../environments/environment';

// ── Param API types ───────────────────────────────────────────────────────────
export interface ParamListRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  type: string;         // "classes" | "sections" | "teachers" | "academic_sessions"
  classId?: string;     // sections ke liye required
  search?: string;
}

export interface ParamDropdownOption {
  id: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private base  = `${environment.apiUrl}/teacher`;
  private param = `${environment.apiUrl}/param`;   // ← shared param endpoint

  constructor(private http: HttpClient) {}

  // ── Param-based dropdowns (lazy load) ────────────────────────────────────

  /** ngOnInit pe sirf classes load hogi */
  getClassOptions(search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      // sortBy: 'className', sortDirection: 'ASC',
      type: 'classes',
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  /** Class select hone ke baad sections load honge */
  getSectionOptions(classId: string, search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      // sortBy: 'sectionName', sortDirection: 'ASC',
      type: 'sections',
      classId,
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  /** Teacher dropdown — param se */
  getTeacherOptions(search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      // sortBy: 'firstName', sortDirection: 'ASC',
      type: 'teachers',
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  /** Academic session dropdown — param se */
  getAcademicSessionOptions(search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0, size: 100,
      sortBy: 'sessionName', sortDirection: 'ASC',
      type: 'academic_sessions',
      search: search || undefined,
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  // ── Teacher CRUD ──────────────────────────────────────────────────────────

  filterTeachers(request: TeacherFilterRequest): Observable<PagedResponse<TeacherResponseDto>> {
    return this.http.post<PagedResponse<TeacherResponseDto>>(`${this.base}/list`, request);
  }

  addOrUpdateTeacher(dto: CreateTeacherDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/addOrUpdate`, dto);
  }

  // ── Assign Class Teacher ──────────────────────────────────────────────────

  assignClassTeacher(dto: AssignClassTeacherDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/assign`, dto);
  }

  filterClassTeacherAssignments(
    request: ClassTeacherAssignmentFilterRequest
  ): Observable<PagedResponse<ClassTeacherAssignmentResponseDto>> {
    return this.http.post<PagedResponse<ClassTeacherAssignmentResponseDto>>(
      `${this.base}/assignedList`,
      request
    );
  }
}