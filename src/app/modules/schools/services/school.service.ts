// modules/schools/services/school.service.ts

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateSchoolForm,
  CreateSchoolResult,
  PlatformPagedResponse,
  PlatformStudentSummary,
  PlatformTeacherSummary,
  SaveSchoolForm,
  School,
  SchoolListApiResponse,
} from '../models/school.model';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private baseUrl = '/platform-admin/schools';

  constructor(private http: HttpService) {}

  listSchools(search: string, page = 0, size = 50): Observable<School[]> {
    return this.http
      .post<SchoolListApiResponse>(`${this.baseUrl}/list`, {
        search,
        page,
        size,
        sortBy: 'schoolName',
        sortDirection: 'asc',
      })
      .pipe(map((res) => res.data ?? []));
  }

  createSchool(form: CreateSchoolForm): Observable<CreateSchoolResult> {
    return this.http
      .post<ApiEnvelope<CreateSchoolResult>>(this.baseUrl, form)
      .pipe(map((res) => res.data));
  }

  updateSchool(id: string, form: SaveSchoolForm): Observable<School> {
    return this.http
      .put<ApiEnvelope<School>>(`${this.baseUrl}/${id}`, form)
      .pipe(map((res) => res.data));
  }

  getSchoolStudents(schoolId: string, page = 0, size = 50): Observable<PlatformPagedResponse<PlatformStudentSummary>> {
    return this.http.get<PlatformPagedResponse<PlatformStudentSummary>>(
      `${this.baseUrl}/${schoolId}/students`,
      { page: String(page), size: String(size) }
    );
  }

  getSchoolTeachers(schoolId: string, page = 0, size = 50): Observable<PlatformPagedResponse<PlatformTeacherSummary>> {
    return this.http.get<PlatformPagedResponse<PlatformTeacherSummary>>(
      `${this.baseUrl}/${schoolId}/teachers`,
      { page: String(page), size: String(size) }
    );
  }
}
