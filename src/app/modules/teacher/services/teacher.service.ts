import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private base = `${environment.apiUrl}/teacher`;

  constructor(private http: HttpClient) {}

  // ── Teacher CRUD ──────────────────────────────────────────────────────────

  filterTeachers(request: TeacherFilterRequest): Observable<PagedResponse<TeacherResponseDto>> {  // data[] is top-level
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