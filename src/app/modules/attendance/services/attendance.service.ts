// src/app/modules/attendance/services/attendance.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BulkAttendanceRequestDto, AttendanceFilterRequest, TeacherClassResponseDto } from '../models/attendance.model';
import { PagedResponse } from '../../teacher/models/teacher.model';

// Explicit dynamic response wrapper declaration locally to bypass missing shared type references
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private base = `${environment.apiUrl}/teacher`;
  private attendanceBase = `${environment.apiUrl}/attendance`;
  private studentBase = `${environment.apiUrl}/students`; 

  constructor(private http: HttpClient) {}

  submitBulkAttendance(dto: BulkAttendanceRequestDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.attendanceBase}/bulkAttendance`, dto);
  }

  getMyClassDetails(): Observable<ApiResponse<TeacherClassResponseDto>> {
    return this.http.get<ApiResponse<TeacherClassResponseDto>>(`${this.base}/myClass`);
  }

  filterAttendanceRecords(request: AttendanceFilterRequest): Observable<PagedResponse<any>> {
    return this.http.post<PagedResponse<any>>(`${this.attendanceBase}/list`, request);
  }

  // ── Added this method to load dynamic student check sheets ──
  // ✅ FIX: attendanceDate ab parameter se aa raha hai, hardcoded nahi
  getStudentsForAttendance(classId: string, sectionId: string, sessionId: string, attendanceDate: string): Observable<PagedResponse<any>> {
    const filterReq = {
      page: 0,
      size: 200,
      classId: classId,
      sectionId: sectionId,
      academicSessionId: sessionId,
      attendanceDate: attendanceDate,
      sortBy: 'firstName',
      sortDirection: 'asc'
    };
    return this.http.post<PagedResponse<any>>(`${this.studentBase}/list`, filterReq);
  }
}