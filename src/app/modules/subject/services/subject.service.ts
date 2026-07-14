import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../teacher/models/teacher.model'; // Mapped from shared structure
import {
  SubjectResponseDto,
  CreateSubjectDto,
  SubjectFilterRequest,
  AssignSubjectTeacherDto,
  SubjectTeacherAssignmentFilterRequest,
  SubjectTeacherAssignmentResponseDto
} from '../models/subject.model';

// Param API Interface matching list query architecture
export interface ParamListRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
  type: 'classes' | 'sections' | 'teachers' | 'subjects' | 'academic_sessions';
  classId?: string; // Required when type === 'sections'
  search?: string;
}

export interface ParamDropdownOption {
  id: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private base = `${environment.apiUrl}/subject`;
  private param = `${environment.apiUrl}/param`; // Mapped to your shared param structure

  constructor(private http: HttpClient) { }

  // ── Param-based Dropdowns (Lazy Loaded Helpers for Filters/Forms) ──────────

  getDropdownOptions(type: 'classes' | 'teachers' | 'subjects' | 'academic_sessions', search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      type: type,
      search: search || undefined
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  getSectionOptions(classId: string, search = ''): Observable<ParamDropdownOption[]> {
    const req: ParamListRequest = {
      page: 0,
      size: 100,
      type: 'sections',
      classId: classId,
      search: search || undefined
    };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  // ── Core Subject CRUD ──────────────────────────────────────────────────────

  filterSubjects(request: SubjectFilterRequest): Observable<PagedResponse<SubjectResponseDto>> {
    return this.http.post<PagedResponse<SubjectResponseDto>>(`${this.base}/list`, request);
  }

  addOrUpdateSubject(dto: CreateSubjectDto): Observable<any> {
    return this.http.post<any>(`${this.base}/addOrUpdate`, dto);
  }

  deleteSubject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/delete/${id}`);
  }

  restoreSubject(id: string): Observable<any> {
    return this.http.post<any>(`${this.base}/restore/${id}`, {});
  }

  // ── Subject Teacher Assignment Endpoints ───────────────────────────────────

  assignSubjectTeacher(dto: AssignSubjectTeacherDto): Observable<any> {
    return this.http.post<any>(`${this.base}/assign`, dto);
  }

  filterSubjectTeacherAssignments(
    request: SubjectTeacherAssignmentFilterRequest
  ): Observable<PagedResponse<SubjectTeacherAssignmentResponseDto>> {
    return this.http.post<PagedResponse<SubjectTeacherAssignmentResponseDto>>(`${this.base}/assignedList`, request);
  }
}