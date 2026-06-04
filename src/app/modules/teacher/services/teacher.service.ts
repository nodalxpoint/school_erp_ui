import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateTeacherRequest,
  AssignClassTeacherRequest,
  TeacherFilterRequest,
  TeacherResponseDto,
  ClassItem,
  SectionItem,
  PagedResponse,
  ApiResponse,
} from '../models/teacher.model';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly BASE = '/api/teacher';
  private readonly CLASS_BASE = '/api/school/classAndSection';

  constructor(private http: HttpService) {}

  // ─── Teacher ───────────────────────────────────────────────────

  /**
   * POST /api/teacher/list
   */
  filterTeachers(
    request: TeacherFilterRequest
  ): Observable<PagedResponse<TeacherResponseDto>> {
    return this.http.post<PagedResponse<TeacherResponseDto>>(
      `${this.BASE}/list`,
      request
    );
  }

  /**
   * POST /api/teacher/addOrUpdate
   */
  saveTeacher(request: CreateTeacherRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      request
    );
  }

  /**
   * POST /api/teacher/assign
   * Backend handles upsert — same class+section+session = update teacher
   */
  assignClassTeacher(
    request: AssignClassTeacherRequest
  ): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/assign`,
      request
    );
  }

  // ─── Classes ───────────────────────────────────────────────────
  // TODO: Wire up once GET /api/school/classAndSection/list is built
  // Endpoint will return List<ClassItem> or PagedResponse<ClassItem>
  // getClasses(): Observable<ClassItem[]> {
  //   return this.http.get<ClassItem[]>('/api/school/classAndSection/list');
  // }

  // ─── Sections ──────────────────────────────────────────────────
  // TODO: Wire up once GET /api/school/section/by-class/:classId is built
  // getSectionsByClass(classId: string): Observable<SectionItem[]> {
  //   return this.http.get<SectionItem[]>(`/api/school/section/by-class/${classId}`);
  // }
}