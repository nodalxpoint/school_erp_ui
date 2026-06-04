import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import {
  CreateClassRequest,
  BulkCreateClassRequest,
  ApiResponse,
} from '../models/school.model';

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly BASE = '/api/school/classAndSection';

  constructor(private http: HttpService) {}

  /**
   * POST /api/school/classAndSection/addOrUpdate
   * classId empty = create new class
   * classId present = add sections to existing class
   */
  saveClass(request: CreateClassRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/addOrUpdate`,
      request
    );
  }

  /**
   * POST /api/school/classAndSection/bulkCreateClasses
   */
  bulkCreateClasses(
    request: BulkCreateClassRequest
  ): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.BASE}/bulkCreateClasses`,
      request
    );
  }

  // TODO: uncomment when GET APIs are built on backend
  // getClasses(): Observable<ClassItem[]> {
  //   return this.http.get<ClassItem[]>(`${this.BASE}/list`);
  // }
  // getSectionsByClass(classId: string): Observable<SectionItem[]> {
  //   return this.http.get<SectionItem[]>(`/api/school/section/by-class/${classId}`);
  // }
}