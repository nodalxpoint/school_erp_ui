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
  private base = `${environment.apiUrl}/attendance`;
  private studentBase = `${environment.apiUrl}/students`; 

  constructor(private http: HttpClient) {}

  submitBulkAttendance(dto: BulkAttendanceRequestDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/bulkAttendance`, dto);
  }

  getMyClassDetails(): Observable<ApiResponse<TeacherClassResponseDto>> {
    return this.http.get<ApiResponse<TeacherClassResponseDto>>(`${this.base}/myClass`);
  }

  filterAttendanceRecords(request: AttendanceFilterRequest): Observable<PagedResponse<any>> {
    return this.http.post<PagedResponse<any>>(`${this.base}/list`, request);
  }

  // ── Added this method to load dynamic student check sheets ──
  getStudentsForAttendance(classId: string, sectionId: string, sessionId: string): Observable<PagedResponse<any>> {
    const filterReq = {
      page: 0,
      size: 200, // Large chunk data reading
      classId: classId,
      sectionId: sectionId,
      academicSessionId: sessionId,
      sortBy: 'firstName',
      sortDirection: 'asc'
    };
    return this.http.post<PagedResponse<any>>(`${this.studentBase}/list`, filterReq);
  }
}