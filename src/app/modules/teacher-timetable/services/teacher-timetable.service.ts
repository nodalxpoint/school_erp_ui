import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TimetableDto } from '../../timetable/models/timetable.model';
import { TeacherTimetableFilterRequest } from '../models/teacher-timetable.model';

export interface TeacherClassResponseDto {
  teacherId: string; // ✅ Added to parse response parameter cleanly
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  attendanceCheck?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ParamDropdownOption {
  id: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherTimetableService {
  private teacherTimetableBase = `${environment.apiUrl}/teacherTimetable`;
  private classTimetableBase = `${environment.apiUrl}/teacherTimetable`;
  private teacherBase = `${environment.apiUrl}/teacher`;
  private param = `${environment.apiUrl}/param`;

  constructor(private http: HttpClient) {}

  // ── 🔒 ADMIN FLOW: Filter by Teacher Endpoint ──────────────────────────
  filterTeacherTimetable(request: TeacherTimetableFilterRequest): Observable<PagedResponse<TimetableDto>> {
    return this.http.post<PagedResponse<TimetableDto>>(`${this.teacherTimetableBase}/list`, request);
  }

  // ── 🔓 TEACHER FLOW: Fetch Mapped Class via HttpGet ─────────────────────
  getMyClassDetails(): Observable<ApiResponse<TeacherClassResponseDto>> {
    return this.http.get<ApiResponse<TeacherClassResponseDto>>(`${this.teacherBase}/myClass`);
  }

  // ── 🔓 TEACHER FLOW: Filter timetable WITH teacherId added to payload ──
  filterClassTimetable(classId: string, sectionId: string, sessionId: string, teacherId: string): Observable<PagedResponse<TimetableDto>> {
    const payload = {
      page: 0,
      size: 200,
      sortBy: 'period',
      sortDirection: 'asc',
      classId: classId,
      sectionId: sectionId,
      academicSessionId: sessionId,
      teacherId: teacherId // 🔥 FIX: Passed teacherId inside payload explicitly!
    };
    return this.http.post<PagedResponse<TimetableDto>>(`${this.classTimetableBase}/list`, payload);
  }

  // ── 🔄 Core Add Or Update API Trigger (Shared for both roles) ───────────
  addOrUpdateTimetable(dto: TimetableDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.classTimetableBase}/addOrUpdate`, dto);
  }

  // ── Shared Dropdowns Lookups ─────────────────────────────────────────────
  getOptions(type: 'classes' | 'teachers' | 'subjects' | 'academic_sessions', search = ''): Observable<ParamDropdownOption[]> {
    const req = { page: 0, size: 100, type: type, search: search || undefined };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }

  getSectionOptions(classId: string): Observable<ParamDropdownOption[]> {
    const req = { page: 0, size: 100, type: 'sections', classId: classId };
    return this.http
      .post<PagedResponse<{ id: string; label: string }>>(`${this.param}/list`, req)
      .pipe(map(res => (res.data ?? []).map(d => ({ id: d.id, label: d.label }))));
  }
}